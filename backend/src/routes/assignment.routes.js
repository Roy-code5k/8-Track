const express = require('express');
const { getAssignments, createAssignment, updateAssignment, deleteAssignment } = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getAssignments);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

module.exports = router;
