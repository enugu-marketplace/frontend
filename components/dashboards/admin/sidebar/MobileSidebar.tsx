"use client";
import React, { useContext } from "react";
import { CommonDashboardContext } from "@/providers/StateContext";
import Sidebar from "./Sidebar";
import { Session } from "next-auth"; 

const MobileSideBar = ({ dashboard, session }: { dashboard: string; session: Session }) => {
  const { showSideBar, setShowSideBar } = useContext(CommonDashboardContext);
  return (
    <div
      onClick={() => setShowSideBar(false)}
      className={` fixed sm:hidden left-0 top-0 w-full h-screen transform ease-in-out duration-300  bg-[rgba(0,0,0,0.4)] z-[9999] ${
        showSideBar ? " translate-x-0" : "-translate-x-full"
      }`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="  w-3/5 bg-green-700 h-full  font-bold p-3 overflow-auto"
      >
        <Sidebar dashboard={dashboard} session={session} />
      </div>
    </div>
  );
};

export default MobileSideBar;
