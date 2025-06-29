import React from 'react'
import { FaBeer, FaHome, FaHouseUser, FaSearch, FaBars } from "react-icons/fa";

function Header({ onToggleSidebar }) {
  return (
    <div className='h-[50px] bg-white w-full flex justify-between items-center p-2'>
        <div className='flex gap-2'>
            <FaHome color='black' size={20}/>
            <h1>Dashboard</h1>
        </div>
        <div className='flex items-center gap-2 relative w-[35%] h-[35px]'>
            <FaSearch color='grey' className='absolute top-2.5 left-4'/>
            <input className='border-2 rounded-[20px] border-gray-300 pl-[40px] w-full text-start p-[5px]' type="text" placeholder='search'/>
            <button onClick={onToggleSidebar} className='ml-2 p-2 rounded-full hover:bg-gray-200 transition-colors'>
              <FaBars size={20} />
            </button>
        </div>
    </div>
  )
}

export default Header