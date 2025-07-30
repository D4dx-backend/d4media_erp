const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

// Import models
const User = require('../models/User');
const Department = require('../models/Department');
const Task = require('../models/Task');
const StudioBooking = require('../models/StudioBooking');
const Invoice = require('../models/Invoice');

const connectDB = async () => {
  try {
    // Check if MongoDB URI is properly configured
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('*****')) {
      console.error('❌ MongoDB URI not properly configured.');
      console.log('Please update your .env file with actual MongoDB credentials.');
      console.log('Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Please check your MongoDB credentials and network connection.');
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Task.deleteMany({});
    await StudioBooking.deleteMany({});
    await Invoice.deleteMany({});
    
    console.log('Cleared existing data');

    // Create departments
    const departments = [
      {
        name: 'Studio Booking',
        code: 'STUDIO',
        description: 'Equipment and space reservation management',
        taskTypes: [
          { name: 'Studio Session', estimatedHours: 4, billingRate: 100 },
          { name: 'Equipment Rental', estimatedHours: 1, billingRate: 50 }
        ]
      },
      {
        name: 'Graphic Design',
        code: 'DESIGN',
        description: 'Creative design and visual content creation',
        taskTypes: [
          { name: 'Logo Design', estimatedHours: 8, billingRate: 75 },
          { name: 'Brochure Design', estimatedHours: 12, billingRate: 60 },
          { name: 'Social Media Graphics', estimatedHours: 4, billingRate: 50 }
        ]
      },
      {
        name: 'Video Editing',
        code: 'VIDEO',
        description: 'Video production and post-production services',
        taskTypes: [
          { name: 'Video Editing', estimatedHours: 16, billingRate: 80 },
          { name: 'Motion Graphics', estimatedHours: 20, billingRate: 90 },
          { name: 'Color Correction', estimatedHours: 8, billingRate: 70 }
        ]
      },
      {
        name: 'Events',
        code: 'EVENTS',
        description: 'Event coordination and management',
        taskTypes: [
          { name: 'Event Planning', estimatedHours: 40, billingRate: 65 },
          { name: 'Event Photography', estimatedHours: 8, billingRate: 85 },
          { name: 'Event Videography', estimatedHours: 10, billingRate: 95 }
        ]
      },
      {
        name: 'Google/Zoom Services',
        code: 'DIGITAL',
        description: 'Digital services and online meeting management',
        taskTypes: [
          { name: 'Google Workspace Setup', estimatedHours: 4, billingRate: 60 },
          { name: 'Zoom Meeting Management', estimatedHours: 2, billingRate: 40 },
          { name: 'Digital Consultation', estimatedHours: 2, billingRate: 80 }
        ]
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log('Created departments:', createdDepartments.length);

    // Create users
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@d4media.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'super_admin',
        phone: '+1234567890'
      },
      {
        name: 'Reception Staff',
        email: 'reception@d4media.com',
        password: await bcrypt.hash('reception123', 12),
        role: 'reception',
        phone: '+1234567891'
      },
      {
        name: 'Studio Manager',
        email: 'studio@d4media.com',
        password: await bcrypt.hash('studio123', 12),
        role: 'department_admin',
        department: createdDepartments[0]._id,
        phone: '+1234567892'
      },
      {
        name: 'Design Manager',
        email: 'design@d4media.com',
        password: await bcrypt.hash('design123', 12),
        role: 'department_admin',
        department: createdDepartments[1]._id,
        phone: '+1234567893'
      },
      {
        name: 'Video Manager',
        email: 'video@d4media.com',
        password: await bcrypt.hash('video123', 12),
        role: 'department_admin',
        department: createdDepartments[2]._id,
        phone: '+1234567894'
      },
      {
        name: 'Events Manager',
        email: 'events@d4media.com',
        password: await bcrypt.hash('events123', 12),
        role: 'department_admin',
        department: createdDepartments[3]._id,
        phone: '+1234567895'
      },
      {
        name: 'Digital Services Manager',
        email: 'digital@d4media.com',
        password: await bcrypt.hash('digital123', 12),
        role: 'department_admin',
        department: createdDepartments[4]._id,
        phone: '+1234567896'
      },
      {
        name: 'John Designer',
        email: 'john@d4media.com',
        password: await bcrypt.hash('staff123', 12),
        role: 'department_staff',
        department: createdDepartments[1]._id,
        phone: '+1234567897'
      },
      {
        name: 'Sarah Editor',
        email: 'sarah@d4media.com',
        password: await bcrypt.hash('staff123', 12),
        role: 'department_staff',
        department: createdDepartments[2]._id,
        phone: '+1234567898'
      },
      {
        name: 'Demo Client',
        email: 'client@example.com',
        password: await bcrypt.hash('client123', 12),
        role: 'client',
        company: 'Example Corp',
        phone: '+1234567899'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Update departments with admin assignments
    for (let i = 0; i < createdDepartments.length; i++) {
      const adminUser = createdUsers.find(user => 
        user.department && user.department.toString() === createdDepartments[i]._id.toString() && 
        user.role === 'department_admin'
      );
      
      if (adminUser) {
        await Department.findByIdAndUpdate(createdDepartments[i]._id, {
          admin: adminUser._id
        });
      }
    }

    // Get user references for sample data
    const receptionUser = createdUsers.find(u => u.role === 'reception');
    const clientUser = createdUsers.find(u => u.role === 'client');
    const designerUser = createdUsers.find(u => u.email === 'john@d4media.com');
    const editorUser = createdUsers.find(u => u.email === 'sarah@d4media.com');
    const designDept = createdDepartments.find(d => d.code === 'DESIGN');
    const videoDept = createdDepartments.find(d => d.code === 'VIDEO');

    // Create sample tasks with various creation dates for testing reports
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sampleTasks = [
      // Today's tasks
      {
        title: 'Logo Design for Example Corp',
        description: 'Create a modern logo design for Example Corp including variations and brand guidelines',
        department: designDept._id,
        assignedTo: designerUser._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'high',
        status: 'in_progress',
        taskType: 'Logo Design',
        estimatedHours: 8,
        actualHours: 4,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: today,
        billing: {
          rate: 75,
          billable: true
        },
        progress: {
          percentage: 50,
          notes: [{
            note: 'Initial concepts completed, awaiting client feedback',
            addedBy: designerUser._id,
            addedAt: new Date()
          }]
        }
      },
      {
        title: 'Social Media Graphics Package',
        description: 'Create a set of social media graphics for monthly campaign',
        department: designDept._id,
        assignedTo: designerUser._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'medium',
        status: 'completed',
        taskType: 'Social Media Graphics',
        estimatedHours: 4,
        actualHours: 3.5,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: today,
        completedDate: today,
        billing: {
          rate: 50,
          billable: true
        },
        progress: {
          percentage: 100
        }
      },
      {
        title: 'Website Banner Design',
        description: 'Design promotional banner for website homepage',
        department: designDept._id,
        assignedTo: designerUser._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'low',
        status: 'pending',
        taskType: 'Brochure Design',
        estimatedHours: 2,
        actualHours: 0,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: today,
        billing: {
          rate: 60,
          billable: true
        }
      },
      // Yesterday's tasks
      {
        title: 'Product Video Editing',
        description: 'Edit promotional video for new product launch including color correction and motion graphics',
        department: videoDept._id,
        assignedTo: editorUser._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'urgent',
        status: 'review',
        taskType: 'Video Editing',
        estimatedHours: 16,
        actualHours: 12,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        createdAt: yesterday,
        billing: {
          rate: 80,
          billable: true
        },
        progress: {
          percentage: 85
        }
      },
      {
        title: 'Motion Graphics Animation',
        description: 'Create animated logo and transitions for video project',
        department: videoDept._id,
        assignedTo: editorUser._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'high',
        status: 'in_progress',
        taskType: 'Motion Graphics',
        estimatedHours: 20,
        actualHours: 8,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdAt: yesterday,
        billing: {
          rate: 90,
          billable: true
        },
        progress: {
          percentage: 40
        }
      },
      // Two days ago tasks
      {
        title: 'Event Photography Planning',
        description: 'Plan photography coverage for upcoming corporate event',
        department: createdDepartments.find(d => d.code === 'EVENTS')._id,
        assignedTo: createdUsers.find(u => u.department && u.department.toString() === createdDepartments.find(d => d.code === 'EVENTS')._id.toString())._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'medium',
        status: 'completed',
        taskType: 'Event Photography',
        estimatedHours: 8,
        actualHours: 6,
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        createdAt: twoDaysAgo,
        completedDate: yesterday,
        billing: {
          rate: 85,
          billable: true
        },
        progress: {
          percentage: 100
        }
      },
      // Future tasks for next week (to test calendar navigation)
      {
        title: 'Future Project Planning',
        description: 'Plan upcoming project for next week',
        department: designDept._id,
        assignedTo: designerUser._id,
        createdBy: receptionUser._id,
        client: clientUser._id,
        priority: 'low',
        status: 'pending',
        taskType: 'Logo Design',
        estimatedHours: 4,
        actualHours: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: nextWeek,
        billing: {
          rate: 75,
          billable: true
        }
      }
    ];

    const createdTasks = await Task.insertMany(sampleTasks);
    console.log('Created sample tasks:', createdTasks.length);

    // Create sample studio bookings
    const sampleBookings = [
      {
        client: clientUser._id,
        contactPerson: {
          name: 'Demo Client',
          phone: '+1234567899',
          email: 'client@example.com'
        },
        bookingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        timeSlot: {
          startTime: '09:00',
          endTime: '13:00'
        },
        duration: 4,
        purpose: 'Product photography session',
        requirements: 'Professional lighting setup, white backdrop',
        teamSize: 3,
        equipment: [
          { name: 'Professional Camera', quantity: 1, rate: 50 },
          { name: 'Lighting Kit', quantity: 1, rate: 75 }
        ],
        status: 'confirmed',
        pricing: {
          baseRate: 100,
          equipmentCost: 125,
          additionalCharges: [],
          discount: 0,
          totalAmount: 525 // 100 * 4 hours + 125 equipment
        },
        createdBy: receptionUser._id,
        confirmedBy: receptionUser._id,
        confirmedAt: new Date()
      }
    ];

    const createdBookings = await StudioBooking.insertMany(sampleBookings);
    console.log('Created sample bookings:', createdBookings.length);

    // Skip invoice creation for now to focus on task reports
    console.log('Skipped invoice creation for now');

    console.log('✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Super Admin: admin@d4media.com / admin123');
    console.log('Reception: reception@d4media.com / reception123');
    console.log('Studio Manager: studio@d4media.com / studio123');
    console.log('Design Manager: design@d4media.com / design123');
    console.log('Video Manager: video@d4media.com / video123');
    console.log('Events Manager: events@d4media.com / events123');
    console.log('Digital Manager: digital@d4media.com / digital123');
    console.log('Staff (Designer): john@d4media.com / staff123');
    console.log('Staff (Editor): sarah@d4media.com / staff123');
    console.log('Client: client@example.com / client123');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding
const runSeed = async () => {
  await connectDB();
  await seedData();
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData };