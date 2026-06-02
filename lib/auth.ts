import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from 'jsonwebtoken';

// Enhanced error handling with user-friendly messages
class AuthError extends Error {
  constructor(message: string, public code?: string, public userMessage?: string) {
    super(message);
    this.name = 'AuthError';
    this.userMessage = userMessage || this.getUserFriendlyMessage(message, code);
  }

  private getUserFriendlyMessage(message: string, code?: string): string {
    if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED') || message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (message.includes('timeout') || message.includes('TIMEDOUT')) {
      return 'Request timed out. Please try again.';
    }
    if (message.includes('status: 500')) {
      return 'Server is currently unavailable. Please try again later.';
    }
    if (message.includes('status: 404')) {
      return 'Service not found. Please contact support.';
    }
    if (message.includes('status: 401') || message.includes('status: 403')) {
      return 'Invalid credentials. Please check your email and password.';
    }
    if (message.includes('status: 429')) {
      return 'Too many login attempts. Please wait a few minutes and try again.';
    }
    if (code === 'MISSING_CREDENTIALS') {
      return 'Email and password are required.';
    }
    if (code === 'NO_TOKEN') {
      return 'Authentication failed. No security token received.';
    }
    if (code === 'NO_USER_DATA') {
      return 'User information not found. Please contact support.';
    }
    if (code === 'LOGIN_FAILED') {
      return 'Invalid email or password. Please try again.';
    }
    if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('incorrect')) {
      return 'Invalid email or password. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

// Enhanced fetch helper with CORS handling
async function handleAuthFetch(url: string, options: RequestInit) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    console.log('🔗 Making API request to:', url);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const rawBody = await response
        .clone()
        .text()
        .catch(() => 'Unable to read response body');
      let parsedBody: unknown = rawBody;

      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        // Keep raw text when payload is not JSON.
      }

      console.error('❌ API response not OK:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: parsedBody,
        rateLimitRemaining: response.headers.get('x-ratelimit-remaining'),
        requestId: response.headers.get('x-request-id'),
      });
    }
    
    return response;
  } catch (error: any) {
    console.error('🔴 Fetch error details:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      url: url
    });
    
    if (error.name === 'AbortError') {
      throw new AuthError('Request timeout', 'TIMEOUT_ERROR');
    }
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      throw new AuthError('Network connection failed', 'NETWORK_ERROR');
    }
    throw new AuthError(error.message, 'FETCH_ERROR');
  }
}

async function fetchAuthWithFallback(path: string, options: RequestInit) {
  const primaryBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const fallbackBaseUrl = 'https://backend-api.enugufoodmarket.com/api/v1';
  const allowProdFallback = process.env.NEXT_PUBLIC_ALLOW_PROD_FALLBACK === 'true';

  if (!primaryBaseUrl) {
    throw new AuthError('Server configuration error', 'CONFIG_ERROR');
  }

  const primaryUrl = `${primaryBaseUrl}${path}`;
  const canFallback =
    allowProdFallback &&
    primaryBaseUrl.includes('backend-staging.enugufoodmarket.com');

  console.log(`[Auth] Attempting: ${primaryUrl}`);
  console.log(`[Auth] Fallback enabled: ${canFallback} (NEXT_PUBLIC_ALLOW_PROD_FALLBACK=${process.env.NEXT_PUBLIC_ALLOW_PROD_FALLBACK})`);

  try {
    const primaryResponse = await handleAuthFetch(primaryUrl, options);
    console.log(`[Auth] Response from ${primaryUrl}: ${primaryResponse.status}`);

    if (canFallback && primaryResponse.status >= 500) {
      const rawPrimaryBody = await primaryResponse
        .clone()
        .text()
        .catch(() => 'Unable to read response body');
      console.error(`[Auth] Primary non-success body: ${rawPrimaryBody}`);
      console.warn(`[Auth] Staging returned ${primaryResponse.status}. Falling back to production.`);
      const fallbackResponse = await handleAuthFetch(`${fallbackBaseUrl}${path}`, options);
      console.log(`[Auth] Fallback response: ${fallbackResponse.status}`);
      return fallbackResponse;
    }

    return primaryResponse;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Auth] Request to ${primaryUrl} threw: ${errMsg}`);

    if (!canFallback) {
      console.error('[Auth] No fallback configured — rethrowing error.');
      throw error;
    }

    console.warn(`[Auth] Falling back to production: ${fallbackBaseUrl}${path}`);
    const fallbackResponse = await handleAuthFetch(`${fallbackBaseUrl}${path}`, options);
    console.log(`[Auth] Fallback response: ${fallbackResponse.status}`);
    return fallbackResponse;
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  
  // Use cookies that work with cross-origin requests
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
    updateAge: 60 * 60, // 1 hour
  },

  // Enhanced logger to handle client errors better
  logger: {
    error(code, metadata) {
      // Don't log CLIENT_FETCH_ERROR as it's usually network-related
      if (code !== 'CLIENT_FETCH_ERROR') {
        console.error('🔴 NextAuth Error:', { code, metadata });
      }
    },
    warn(code) {
      console.warn('🟡 NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development' && code !== 'CLIENT_FETCH_ERROR') {
        console.log('🔵 NextAuth Debug:', { code, metadata });
      }
    },
  },

  pages: {
    signIn: '/admin-login',
    signOut: '/',
    error: '/auth/error',
    verifyRequest: '/auth/verify-otp',
    newUser: '/auth/new-user'
  },

  providers: [
    CredentialsProvider({
      id: "admin_login",
      name: "Admin",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          console.log('🔐 Admin login attempt started');

          if (!credentials?.identifier || !credentials?.password) {
            throw new AuthError('Email and password are required', 'MISSING_CREDENTIALS');
          }

          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/admin-login`;
          console.log('📡 Calling API:', apiUrl);

          // Verify environment variable is set
          if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
            console.error('❌ NEXT_PUBLIC_API_BASE_URL is not set');
            throw new AuthError('Server configuration error', 'CONFIG_ERROR');
          }

            const response = await fetchAuthWithFallback('/auth/admin-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password
            }),
          });

          // Check if response is OK before trying to parse JSON
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            console.log('❌ API error response:', errorData);
            
            if (response.status === 401) {
              throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
            } else if (response.status === 403) {
              throw new AuthError('Account suspended or access denied', 'ACCOUNT_SUSPENDED');
            } else if (response.status === 404) {
              throw new AuthError('Admin account not found', 'ACCOUNT_NOT_FOUND');
            } else if (response.status === 429) {
              throw new AuthError('Too many login attempts', 'RATE_LIMITED');
            } else if (response.status >= 500) {
              throw new AuthError('Server is currently unavailable', 'SERVER_ERROR');
            }
            
            const errorMessage = errorData.message || `Login failed with status: ${response.status}`;
            throw new AuthError(errorMessage, 'API_ERROR');
          }

          const data = await response.json();
          console.log('📡 Admin API Response success:', data.success);

          if (!data.success) {
            console.log('❌ API success: false', data);
            throw new AuthError(data.message || 'Login failed', 'LOGIN_FAILED');
          }

          if (!data.token) {
            console.log('❌ No token in response');
            throw new AuthError('No authentication token received', 'NO_TOKEN');
          }

          let adminData: any = null;
          
          if (data.token) {
            try {
              const decoded: any = jwt.decode(data.token);
              console.log('🔓 Decoded JWT:', decoded);
              
              if (decoded && decoded.admin) {
                adminData = decoded.admin;
              }
            } catch (decodeError) {
              console.error('Error decoding JWT token:', decodeError);
            }
          }

          if (!adminData) {
            adminData = data.admin || data.super_admin || data.data;
          }

          if (!adminData) {
            console.log('❌ No admin data found');
            throw new AuthError('No admin data received', 'NO_USER_DATA');
          }

          console.log('✅ Admin data extracted successfully');

          const role = adminData.role === 'fulfillment_officer' ? 'fulfillment_officer' : 'super_admin';

          const user = {
            id: adminData.id?.toString() || 'admin-id',
            userId: adminData.id?.toString(),
            name: `${adminData.firstname || adminData.firstName || adminData.firtname || ''} ${adminData.lastname || adminData.lastName || ''}`.trim(),
            email: adminData.email || adminData.mail || credentials.identifier,
            role: role,
            token: data.token,
            username: adminData.username,
            firstname: adminData.firstname,
            lastname: adminData.lastname,
            profile_image: adminData.profile_image,
            is_temp_password: adminData.is_temp_password,
            status: adminData.status || "ACTIVE"
          };

          console.log('✅ Returning user object for admin');
          return user;

        } catch (error: any) {
          console.error('💥 Admin auth error:', error.message);
          
          if (error instanceof AuthError) {
            throw error;
          }
          throw new AuthError(error.message || 'Admin authentication failed', 'UNKNOWN_ERROR');
        }
      },
    }),

    CredentialsProvider({
      id: "fulfillment_officer_login",
      name: "Fulfillment Officer",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          console.log('🔐 Fulfillment officer login attempt started');

          if (!credentials?.identifier || !credentials?.password) {
            throw new AuthError('Email and password are required', 'MISSING_CREDENTIALS');
          }

          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/fulfillment-officer-login`;
          console.log('📡 Calling API:', apiUrl);

          const response = await fetchAuthWithFallback('/auth/fulfillment-officer-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password
            }),
          });

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            console.log('❌ API error response:', errorData);
            
            if (response.status === 401) {
              throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
            } else if (response.status === 403) {
              throw new AuthError('Account access denied', 'ACCESS_DENIED');
            } else if (response.status >= 500) {
              throw new AuthError('Server is currently unavailable', 'SERVER_ERROR');
            }
            
            throw new AuthError(
              errorData.message || `Login failed with status: ${response.status}`, 
              'API_ERROR'
            );
          }

          const data = await response.json();
          console.log('📡 Fulfillment officer API Response success:', data.success);

          if (!data.success) {
            console.log('❌ API success: false', data);
            throw new AuthError(data.message || 'Fulfillment officer login failed', 'LOGIN_FAILED');
          }

          if (!data.token) {
            console.log('❌ No token in response');
            throw new AuthError('No authentication token received', 'NO_TOKEN');
          }

          let adminData: any = null;
          
          if (data.token) {
            try {
              const decoded: any = jwt.decode(data.token);
              console.log('🔓 Decoded JWT:', decoded);
              
              if (decoded && decoded.admin) {
                adminData = decoded.admin;
              }
            } catch (decodeError) {
              console.error('Error decoding JWT token:', decodeError);
            }
          }

          if (!adminData) {
            adminData = data.admin || data.data;
          }

          if (!adminData) {
            console.log('❌ No admin data found');
            throw new AuthError('No admin data received', 'NO_USER_DATA');
          }

          console.log('✅ Fulfillment officer data extracted');

          const user = {
            id: adminData.id?.toString(),
            userId: adminData.id?.toString(),
            name: `${adminData.firstname || adminData.firstName || adminData.firtname || ''} ${adminData.lastname || adminData.lastName || ''}`.trim(),
            email: adminData.email || adminData.mail,
            role: "fulfillment_officer",
            token: data.token,
            username: adminData.username,
            firstname: adminData.firstname,
            lastname: adminData.lastname,
            profile_image: adminData.profile_image,
            is_temp_password: adminData.is_temp_password,
            status: adminData.status || "ACTIVE"
          };

          console.log('✅ Returning user object for fulfillment officer');
          return user;

        } catch (error: any) {
          console.error('💥 Fulfillment officer auth error:', error);
          
          if (error instanceof AuthError) {
            throw error;
          }
          throw new AuthError(error.message || 'Fulfillment officer authentication failed', 'UNKNOWN_ERROR');
        }
      },
    }),

    CredentialsProvider({
      id: "cashier_login",
      name: "Cashier",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          console.log('🔐 Cashier login attempt started');

          if (!credentials?.identifier || !credentials?.password) {
            throw new AuthError('Email and password are required', 'MISSING_CREDENTIALS');
          }

          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/cashier-login`;
          console.log('📡 Calling API:', apiUrl);

          const response = await fetchAuthWithFallback('/auth/cashier-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password
            }),
          });

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            console.log('❌ API error response:', errorData);
            
            if (response.status === 401) {
              throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
            } else if (response.status === 403) {
              throw new AuthError('Cashier account not authorized', 'UNAUTHORIZED');
            } else if (response.status >= 500) {
              throw new AuthError('Server is currently unavailable', 'SERVER_ERROR');
            }
            
            throw new AuthError(
              errorData.message || `Cashier login failed with status: ${response.status}`, 
              'API_ERROR'
            );
          }

          const data = await response.json();
          console.log('📡 Cashier API Response success:', data.success);

          if (!data.success) {
            console.log('❌ API success: false', data);
            throw new AuthError(data.message || 'Cashier login failed', 'LOGIN_FAILED');
          }

          if (!data.token) {
            console.log('❌ No token in response');
            throw new AuthError('No authentication token received', 'NO_TOKEN');
          }

          let cashierData: any = null;
          
          if (data.token) {
            try {
              const decoded: any = jwt.decode(data.token);
              console.log('🔓 Decoded JWT:', decoded);
              
              if (decoded && decoded.cashier) {
                cashierData = decoded.cashier;
              }
            } catch (decodeError) {
              console.error('Error decoding JWT token:', decodeError);
            }
          }

          if (!cashierData) {
            cashierData = data.cashier || data.data;
          }

          if (!cashierData) {
            console.log('❌ No cashier data found');
            throw new AuthError('No cashier data received', 'NO_USER_DATA');
          }

          console.log('✅ Cashier data extracted');

          const user = {
            id: cashierData.id?.toString() || 'cashier-id',
            userId: cashierData.id?.toString(),
            name: `${cashierData.firstname || cashierData.firstName || cashierData.firtname || ''} ${cashierData.lastname || cashierData.lastName || ''}`.trim(),
            email: cashierData.email || cashierData.mail || credentials.identifier,
            role: "cashier",
            token: data.token,
            username: cashierData.username,
            firstname: cashierData.firstname,
            lastname: cashierData.lastname,
            profile_image: cashierData.profile_image,
            status: "ACTIVE",
            created_at: cashierData.created_at,
            updated_at: cashierData.updated_at
          };

          console.log('✅ Returning user object for cashier');
          return user;

        } catch (error: any) {
          console.error('💥 Cashier auth error:', error.message);
          
          if (error instanceof AuthError) {
            throw error;
          }
          throw new AuthError(error.message || 'Cashier authentication failed', 'UNKNOWN_ERROR');
        }
      },
    }),

    CredentialsProvider({
      id: "credentials",
      name: "Employee",
      credentials: {
        userId: { label: "User ID", type: "text" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials, req) {
        try {
          console.log('🔐 Employee OTP verification attempt started');

          if (!credentials?.userId || !credentials?.otp) {
            throw new AuthError('User ID and OTP are required', 'MISSING_CREDENTIALS');
          }

          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`;
          console.log('📡 Calling API:', apiUrl);

          const response = await fetchAuthWithFallback('/auth/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              userId: credentials.userId,
              otp: credentials.otp
            })
          });

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            console.log('❌ API error response:', errorData);
            
            if (response.status === 400) {
              throw new AuthError('Invalid or expired OTP', 'INVALID_OTP');
            } else if (response.status === 404) {
              throw new AuthError('User not found', 'USER_NOT_FOUND');
            } else if (response.status >= 500) {
              throw new AuthError('Server is currently unavailable', 'SERVER_ERROR');
            }
            
            throw new AuthError(
              errorData.message || `OTP verification failed with status: ${response.status}`, 
              'API_ERROR'
            );
          }

          const data = await response.json();
          console.log('📡 Employee OTP API Response success:', data.success);

          if (!data.success) {
            console.log('❌ API success: false', data);
            throw new AuthError(data.message || 'OTP verification failed', 'LOGIN_FAILED');
          }

          if (!data.token) {
            console.log('❌ No token in response');
            throw new AuthError('No authentication token received', 'NO_TOKEN');
          }

          let userData: any = null;
          
          if (data.token) {
            try {
              const decoded: any = jwt.decode(data.token);
              console.log('🔓 Decoded JWT:', decoded);
              
              if (decoded && decoded.user) {
                userData = decoded.user;
              }
            } catch (decodeError) {
              console.error('Error decoding JWT token:', decodeError);
            }
          }

          if (!userData) {
            userData = data.user || data.data;
          }

          if (!userData) {
            console.log('❌ No user data found');
            throw new AuthError('No user data received', 'NO_USER_DATA');
          }

          console.log('✅ Employee data extracted');

          const user = {
            id: userData.id?.toString(),
            userId: userData.id?.toString(),
            name: `${userData.firstname || userData.firstName || userData.firtname || ''} ${userData.lastname || userData.lastName || ''}`.trim(),
            email: userData.email || userData.mail,
            role: "user",
            token: data.token,
            status: userData.status || "PENDING",
            is_compliance_submitted: userData.is_compliance_submitted || false,
            // Add all loan-related fields
            loan_unit: Number(userData.loan_unit ?? 0),
            loan_amount_collected: Number(userData.loan_amount_collected ?? 0),
            loan_extension: Number(userData.loan_extension ?? 0),
            max_extension_limit: Number(userData.max_extension_limit ?? 0),
            salary_per_month: Number(userData.salary_per_month ?? 0),
            government_entity: userData.government_entity ?? '',
            phone: userData.phone,
            employee_id: userData.employee_id,
            verification_id: userData.verification_id,
            level: userData.level,
            is_address_set: userData.is_address_set || false,
            profile_image: userData.profile_image,
            otp: userData.otp,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          };

          console.log('✅ Returning user object for employee');
          return user;

        } catch (error: any) {
          console.error('💥 Employee auth error:', error);
          
          if (error instanceof AuthError) {
            throw error;
          }
          throw new AuthError(error.message || 'Employee authentication failed', 'UNKNOWN_ERROR');
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile, credentials }) {
      console.log('🔐 SignIn callback - user role:', user?.role);
      
      if (user) {
        console.log('✅ SignIn allowed for user:', user.email);
        return true;
      }
      
      console.log('❌ SignIn denied - no user object');
      return `/auth/error?error=${encodeURIComponent('Authentication failed: No user data returned')}`;
    },

    async jwt({ token, user, trigger, session }) {
      try {
        // console.log('🔄 JWT callback - trigger:', trigger);

        if (user) {
          console.log('✅ Adding user data to JWT token');
          
          // Create base token object
          const newToken: any = {
            ...token,
            id: String(user.id || ''),
            userId: String(user.userId || user.id || ''),
            name: String(user.name || ''),
            email: String(user.email || ''),
            role: String(user.role || ''),
            token: String(user.token || ''),
            status: String(user.status || 'ACTIVE'),
          };

          // Add optional fields
          if (user.username) newToken.username = String(user.username);
          if (user.firstname) newToken.firstname = String(user.firstname);
          if (user.lastname) newToken.lastname = String(user.lastname);
          if (user.profile_image) newToken.profile_image = String(user.profile_image);
          
          if (typeof user.is_temp_password !== 'undefined') {
            newToken.is_temp_password = Boolean(user.is_temp_password);
          }
          
          // Add employee-specific fields
          if (user.phone) newToken.phone = String(user.phone);
          if (user.level) newToken.level = String(user.level);
          if (user.employee_id) newToken.employee_id = String(user.employee_id);
          if (user.government_entity) newToken.government_entity = String(user.government_entity);
          
          if (typeof user.salary_per_month !== 'undefined') {
            newToken.salary_per_month = Number(user.salary_per_month);
          }
          
          if (typeof user.loan_unit !== 'undefined') {
            newToken.loan_unit = Number(user.loan_unit);
          }
          
          if (typeof user.loan_amount_collected !== 'undefined') {
            newToken.loan_amount_collected = Number(user.loan_amount_collected);
          }

          if (typeof user.loan_extension !== 'undefined') {
            newToken.loan_extension = Number(user.loan_extension);
          }

          if (typeof user.max_extension_limit !== 'undefined') {
            newToken.max_extension_limit = Number(user.max_extension_limit);
          }
          
          if (typeof user.is_address_set !== 'undefined') {
            newToken.is_address_set = Boolean(user.is_address_set);
          }
          
          if (typeof user.is_compliance_submitted !== 'undefined') {
            newToken.is_compliance_submitted = Boolean(user.is_compliance_submitted);
          }
          
          if (user.verification_id) newToken.verification_id = String(user.verification_id);
          
          // Fix for createdAt and updatedAt
          if (user.createdAt !== undefined) {
            newToken.createdAt = String(user.createdAt);
          }
          
          if (user.updatedAt !== undefined) {
            newToken.updatedAt = String(user.updatedAt);
          }
          
          return newToken;
        }
        
        if (trigger === "update" && session?.user) {
          console.log('🔄 Updating JWT token with session data');
          return { ...token, ...session.user };
        }
        
        return token;
      } catch (error) {
        console.error('❌ JWT callback error:', error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        console.log('🔄 Session callback - token role:', token.role);
        
        // Create the base user object
        const user: any = {
          id: String(token.id || ''),
          userId: String(token.userId || token.id || ''),
          name: String(token.name || ''),
          email: String(token.email || ''),
          role: String(token.role || ''),
          token: String(token.token || ''),
          status: String(token.status || 'ACTIVE'),
        };

        // Add optional fields if they exist
        if (token.username) user.username = String(token.username);
        if (token.firstname) user.firstname = String(token.firstname);
        if (token.lastname) user.lastname = String(token.lastname);
        if (token.profile_image) user.profile_image = String(token.profile_image);
        
        if (typeof token.is_temp_password !== 'undefined') {
          user.is_temp_password = Boolean(token.is_temp_password);
        }
        
        // Add employee-specific fields
        if (token.phone) user.phone = String(token.phone);
        if (token.level) user.level = String(token.level);
        if (token.employee_id) user.employee_id = String(token.employee_id);
        if (token.government_entity) user.government_entity = String(token.government_entity);
        
        if (typeof token.salary_per_month !== 'undefined') {
          user.salary_per_month = Number(token.salary_per_month);
        }
        
        if (typeof token.loan_unit !== 'undefined') {
          user.loan_unit = Number(token.loan_unit);
        }
        
        if (typeof token.loan_amount_collected !== 'undefined') {
          user.loan_amount_collected = Number(token.loan_amount_collected);
        }

        if (typeof token.loan_extension !== 'undefined') {
          user.loan_extension = Number(token.loan_extension);
        }

        if (typeof token.max_extension_limit !== 'undefined') {
          user.max_extension_limit = Number(token.max_extension_limit);
        }
        
        if (typeof token.is_address_set !== 'undefined') {
          user.is_address_set = Boolean(token.is_address_set);
        }
        
        if (typeof token.is_compliance_submitted !== 'undefined') {
          user.is_compliance_submitted = Boolean(token.is_compliance_submitted);
        }
        
        if (token.verification_id) user.verification_id = String(token.verification_id);
        
        // Fix for createdAt and updatedAt - check if they exist and are not undefined
        if (token.createdAt !== undefined) {
          user.createdAt = String(token.createdAt);
        }
        
        if (token.updatedAt !== undefined) {
          user.updatedAt = String(token.updatedAt);
        }

        const safeSession = {
          ...session,
          user
        };

        console.log('✅ Session created successfully for:', safeSession.user.email);
        return safeSession;
        
      } catch (error) {
        console.error('❌ Session callback error:', error);
        return {
          ...session,
          user: {
            id: '',
            name: '',
            email: '',
            role: '',
            token: '',
            status: 'ERROR'
          }
        };
      }
    },

    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback - url:', url, 'baseUrl:', baseUrl);
      
      if (url.includes('/api/auth/callback') || url.includes('/api/auth/signin')) {
        console.log('✅ Successful login, redirecting to dashboard');
        return `${baseUrl}/dashboard`;
      }
      
      if (url.includes('/api/auth/error')) {
        try {
          const errorUrl = new URL(url, baseUrl);
          const error = errorUrl.searchParams.get('error');
          
          console.log('❌ Auth error redirect:', error);
          
          if (error) {
            return `${baseUrl}/auth/error?error=${encodeURIComponent(error)}`;
          }
        } catch (e) {
          console.error('Error parsing error URL:', e);
        }
        return `${baseUrl}/auth/error?error=${encodeURIComponent('Authentication failed')}`;
      }
      
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (e) {
        console.error('Invalid URL in redirect:', url);
      }
      
      return baseUrl;
    }
  },
};

export async function getServerUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user;
  } catch (error) {
    console.error('❌ getServerUser error:', error);
    return null;
  }
}