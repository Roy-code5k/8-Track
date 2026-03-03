const express = require('express');
const { markAttendance, getAttendanceHistory, updateAttendance, deleteAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.post('/', markAttendance);
router.get('/:subjectId', getAttendanceHistory);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;
