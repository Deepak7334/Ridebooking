# TODO - Driver/User data split

- [ ] Implement driver profile storage in `Driver` model and stop writing driver-specific fields into `User`.
- [ ] Update `backend/controllers/driverAuthController.js` to save phone/name/password/role into `User`, and move vehicle/doc/isOnline/location/etc into `Driver`.
- [ ] Update driver routes (`backend/routes/driver/driver.routes.js`) to read/write from `Driver` model.
- [ ] Update ride model / ride assignment logic if it currently uses wrong fields (`user` vs `passengerId`, `driver` vs `driverId`).
- [ ] Run a quick node/mongoose syntax check and ensure server boots.


### 🔄 In Progress
- Fix driver folder issues introduced by new files

### 🛠️ Driver Folder Fix (current work)
- [ ] Fix routing / page exports under `frontend/src/pages/Driver/*`
- [ ] Ensure all driver pages are responsive and user-friendly
- [ ] Ensure bottom navigation (if used) doesn’t break layout
- [ ] Avoid affecting customer/Admin flows
- [ ] Run frontend build/tests to verify no regressions

## 🚀 Run Commands
- backend: `npm start`
- frontend: `cd frontend && npm start`

