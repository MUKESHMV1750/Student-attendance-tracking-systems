require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Staff = require('./models/Staff');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const Location = require('./models/Location');

const seedData = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Staff.deleteMany({}), Student.deleteMany({}),
    Subject.deleteMany({}), Timetable.deleteMany({}), Location.deleteMany({})
  ]);

  // Create staff user
  const staffUser = await User.create({ username: 'staff001', email: 'staff@college.edu', password: 'staff123', role: 'staff' });
  const staff = await Staff.create({ name: 'Dr. Rajesh Kumar', staffId: 'STAFF001', department: 'CSE', email: 'staff@college.edu', phone: '9876543210', userId: staffUser._id });

  // Create admin staff
  const adminUser = await User.create({ username: 'admin', email: 'admin@college.edu', password: 'admin123', role: 'staff' });
  await Staff.create({ name: 'Admin User', staffId: 'ADMIN001', department: 'CSE', email: 'admin@college.edu', phone: '9876543211', userId: adminUser._id });

  // Create students
  const studentData = [
    { name: 'Arun Kumar', rollNo: 'CSE301', registerNo: '712021CS001' },
    { name: 'Priya Sharma', rollNo: 'CSE302', registerNo: '712021CS002' },
    { name: 'Rahul Singh', rollNo: 'CSE303', registerNo: '712021CS003' },
    { name: 'Deepa Nair', rollNo: 'CSE304', registerNo: '712021CS004' },
    { name: 'Karthik M', rollNo: 'CSE305', registerNo: '712021CS005' },
  ];

  for (const s of studentData) {
    const email = s.registerNo.toLowerCase() + '@student.edu';
    const sUser = await User.create({ username: s.registerNo, email, password: s.registerNo, role: 'student' });
    await Student.create({
      ...s, department: 'CSE', year: 'III', section: 'A', semester: 'V',
      email, phone: '98765' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'), userId: sUser._id
    });
  }

  // Create subjects
  const sub1 = await Subject.create({ subjectCode: 'CS301', subjectName: 'Database Management Systems', department: 'CSE', year: 'III', semester: 'V', section: 'A', staffId: staff._id });
  const sub2 = await Subject.create({ subjectCode: 'CS302', subjectName: 'Java Programming', department: 'CSE', year: 'III', semester: 'V', section: 'A', staffId: staff._id });
  const sub3 = await Subject.create({ subjectCode: 'CS303', subjectName: 'Operating Systems', department: 'CSE', year: 'III', semester: 'V', section: 'A', staffId: staff._id });

  // Create timetable
  await Timetable.create({ day: 'Monday', startTime: '09:00', endTime: '10:00', subjectId: sub1._id, staffId: staff._id, department: 'CSE', year: 'III', section: 'A', room: 'CSE-201' });
  await Timetable.create({ day: 'Monday', startTime: '10:00', endTime: '11:00', subjectId: sub2._id, staffId: staff._id, department: 'CSE', year: 'III', section: 'A', room: 'CSE-201' });
  await Timetable.create({ day: 'Tuesday', startTime: '09:00', endTime: '10:00', subjectId: sub3._id, staffId: staff._id, department: 'CSE', year: 'III', section: 'A', room: 'CSE-202' });
  await Timetable.create({ day: 'Wednesday', startTime: '11:15', endTime: '12:15', subjectId: sub1._id, staffId: staff._id, department: 'CSE', year: 'III', section: 'A', room: 'CSE-201' });
  await Timetable.create({ day: 'Friday', startTime: '14:00', endTime: '15:00', subjectId: sub2._id, staffId: staff._id, department: 'CSE', year: 'III', section: 'A', room: 'CSE-201' });

  // Create locations
  await Location.create({ locationName: 'CSE Block - Room 201', latitude: 13.0827, longitude: 80.2707, radius: 50, createdBy: staff._id });
  await Location.create({ locationName: 'CSE Block - Room 202', latitude: 13.0830, longitude: 80.2710, radius: 50, createdBy: staff._id });

  console.log('');
  console.log('========= SEED COMPLETE =========');
  console.log('Staff Login:   username: staff001  password: staff123');
  console.log('Admin Login:   username: admin     password: admin123');
  console.log('Student Login: username: 712021CS001  password: 712021CS001');
  console.log('=================================');
  console.log('');
  process.exit(0);
};

seedData().catch(err => { console.error(err); process.exit(1); });
