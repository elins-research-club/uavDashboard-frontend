// components/DashboardLayout.js
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, roleName = "MEMBER" }) => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="header-bar">UAV DASHBOARD</header>
        <div className="dashboard-grid">
          <section className="maps-section">
            <h3>MAPS</h3>
            <div className="maps-content">
              <div className="map-controls">
                <button className="map-control-button">+</button>
                <button className="map-control-button">-</button>
                <button className="map-control-button">&#9650;</button> {/* Up arrow */}
              </div>
            </div>
          </section>
          <section className="analytics-section">
            <h3>ANALYTICS</h3>
            <div className="analytics-items-wrapper">
              <div className="analytics-items">
                <div className="analytics-item"></div>
                <div className="analytics-item"></div>
                <div className="analytics-item"></div>
                <div className="analytics-item"></div>
                <div className="analytics-item"></div>
                <div className="analytics-item"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;