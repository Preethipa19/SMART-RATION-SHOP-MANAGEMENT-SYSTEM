import React from "react";

const StatCard = ({ icon: Icon, title, value, color, bg, iconColor }) => (
  <div className={`bg-gray-800 p-4 rounded-xl shadow-lg border-l-4 ${color} hover:bg-gray-750 transition-colors`}>
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${bg} ${iconColor} mr-3`}>
        <Icon className="text-lg" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-xl font-bold text-white">{value}</h3>
      </div>
    </div>
  </div>
);

export default StatCard;