const { PrismaClient } = require('../src/generated/prisma');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding the database...');

  // Create default superadmin user
  const adminPassword = await hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@teamo.app' },
    update: {},
    create: {
      email: 'admin@teamo.app',
      name: 'System Administrator',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      password: adminPassword,
    },
  });

  console.log('👤 Created admin user:', adminUser.id);

  // Create a demo workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corporation',
      slug: 'demo-corp',
      status: 'ACTIVE',
      planType: 'PREMIUM',
      address: '123 Demo Street, Bangkok, Thailand',
      taxId: '1234567890123',
      phone: '+66123456789',
      email: 'contact@democorp.com',
      contactPerson: 'John Doe',
    },
  });

  console.log('🏢 Created demo workspace:', demoWorkspace.id);

  // Create workspace member (admin in the workspace)
  const workspaceMember = await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: demoWorkspace.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      workspaceId: demoWorkspace.id,
      userId: adminUser.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('🔑 Created workspace member for admin:', workspaceMember.id);

  // Create departments
  const departments = [
    { name: 'Executive', code: 'EXEC' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Quality Assurance', code: 'QA' },
    { name: 'Product Management', code: 'PM' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Marketing', code: 'MKT' },
  ];

  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: {
        workspaceId_code: {
          workspaceId: demoWorkspace.id,
          code: dept.code,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: dept.name,
        code: dept.code,
        status: 'ACTIVE',
      },
    });
    console.log(`🏢 Created department: ${department.name}`);
  }

  // Get Engineering department for creating teams
  const engDepartment = await prisma.department.findFirst({
    where: {
      workspaceId: demoWorkspace.id,
      code: 'ENG',
    },
  });

  if (engDepartment) {
    // Create teams in Engineering
    const teams = [
      { name: 'Frontend', description: 'Web and mobile frontend teams' },
      { name: 'Backend', description: 'API and service backend teams' },
      { name: 'DevOps', description: 'Infrastructure and operations' },
      { name: 'Data Science', description: 'ML and data analysis' },
    ];

    for (const team of teams) {
      const newTeam = await prisma.team.upsert({
        where: {
          workspaceId_departmentId_name: {
            workspaceId: demoWorkspace.id,
            departmentId: engDepartment.id,
            name: team.name,
          },
        },
        update: {},
        create: {
          workspaceId: demoWorkspace.id,
          departmentId: engDepartment.id,
          name: team.name,
          description: team.description,
          status: 'ACTIVE',
        },
      });
      console.log(`👥 Created team: ${newTeam.name}`);
    }
  }

  // Create position levels
  const positionLevels = [
    { name: 'Intern', level: 1 },
    { name: 'Junior', level: 2 },
    { name: 'Mid-Level', level: 3 },
    { name: 'Senior', level: 4 },
    { name: 'Lead', level: 5 },
    { name: 'Manager', level: 6 },
    { name: 'Director', level: 7 },
    { name: 'VP', level: 8 },
    { name: 'C-Level', level: 9 },
  ];

  for (const level of positionLevels) {
    const posLevel = await prisma.positionLevel.upsert({
      where: {
        workspaceId_level: {
          workspaceId: demoWorkspace.id,
          level: level.level,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: level.name,
        level: level.level,
        status: 'ACTIVE',
      },
    });
    console.log(`📊 Created position level: ${posLevel.name}`);
  }

  // Create positions
  const positions = [
    { name: 'Software Engineer', code: 'SE' },
    { name: 'Quality Assurance Engineer', code: 'QAE' },
    { name: 'Product Manager', code: 'PM' },
    { name: 'UX/UI Designer', code: 'UXD' },
    { name: 'DevOps Engineer', code: 'DOE' },
    { name: 'Data Scientist', code: 'DS' },
    { name: 'Technical Lead', code: 'TL' },
    { name: 'HR Specialist', code: 'HRS' },
    { name: 'Marketing Specialist', code: 'MKS' },
    { name: 'Financial Analyst', code: 'FA' },
  ];

  for (const pos of positions) {
    const position = await prisma.position.upsert({
      where: {
        workspaceId_code: {
          workspaceId: demoWorkspace.id,
          code: pos.code,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: pos.name,
        code: pos.code,
        status: 'ACTIVE',
      },
    });
    console.log(`👔 Created position: ${position.name}`);
  }

  // Create project roles
  const projectRoles = [
    { name: 'Project Manager', description: 'Manages overall project, responsible for delivery' },
    { name: 'Team Lead', description: 'Technical team leader' },
    { name: 'Developer', description: 'Software developer, may be front, back or full stack' },
    { name: 'Designer', description: 'UX/UI designer' },
    { name: 'QA Tester', description: 'Quality assurance tester' },
    { name: 'DevOps', description: 'Infrastructure and deployment' },
    { name: 'Business Analyst', description: 'Business requirements and analysis' },
    { name: 'Stakeholder', description: 'Project stakeholder' },
  ];

  for (const role of projectRoles) {
    const projectRole = await prisma.projectRole.upsert({
      where: {
        workspaceId_name: {
          workspaceId: demoWorkspace.id,
          name: role.name,
        }
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: role.name,
        description: role.description,
      },
    });
    console.log(`🔖 Created project role: ${projectRole.name}`);
  }

  // Create leave types
  const leaveTypes = [
    { 
      name: 'Annual Leave', 
      code: 'AL', 
      description: 'Regular annual leave entitlement',
      color: '#4caf50',
      isPaid: true,
      requiresApproval: true,
      maxDaysPerYear: 15
    },
    { 
      name: 'Sick Leave', 
      code: 'SL', 
      description: 'Leave due to illness',
      color: '#f44336',
      isPaid: true,
      requiresApproval: true,
      requiresAttachment: true,
      maxDaysPerYear: 30
    },
    { 
      name: 'Personal Leave', 
      code: 'PL', 
      description: 'Leave for personal reasons',
      color: '#ff9800',
      isPaid: true,
      requiresApproval: true,
      maxDaysPerYear: 3
    },
    { 
      name: 'Unpaid Leave', 
      code: 'UL', 
      description: 'Leave without pay',
      color: '#9e9e9e',
      isPaid: false,
      requiresApproval: true,
      maxDaysPerYear: null
    },
    { 
      name: 'Maternity Leave', 
      code: 'ML', 
      description: 'Leave for childbirth and care',
      color: '#e91e63',
      isPaid: true,
      requiresApproval: true,
      requiresAttachment: true,
      maxDaysPerYear: 90
    },
    { 
      name: 'Paternity Leave', 
      code: 'PTL', 
      description: 'Leave for new fathers',
      color: '#2196f3',
      isPaid: true,
      requiresApproval: true,
      maxDaysPerYear: 15
    },
  ];

  for (const type of leaveTypes) {
    const leaveType = await prisma.leaveType.upsert({
      where: {
        workspaceId_code: {
          workspaceId: demoWorkspace.id,
          code: type.code,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: type.name,
        code: type.code,
        description: type.description,
        color: type.color,
        isPaid: type.isPaid,
        requiresApproval: type.requiresApproval,
        requiresAttachment: type.requiresAttachment || false,
        maxDaysPerYear: type.maxDaysPerYear,
        status: 'ACTIVE',
      },
    });
    console.log(`🏝️ Created leave type: ${leaveType.name}`);
  }

  // Create OT policies
  const otPolicies = [
    {
      name: 'Weekday OT',
      description: 'Overtime during weekdays',
      rate: 1.5,
      minimumHours: 1,
      maximumHours: 4,
    },
    {
      name: 'Weekend OT',
      description: 'Overtime during weekends',
      rate: 2.0,
      minimumHours: 2,
      maximumHours: 8,
    },
    {
      name: 'Holiday OT',
      description: 'Overtime during holidays',
      rate: 3.0,
      minimumHours: 2,
      maximumHours: 8,
    },
  ];

  for (const policy of otPolicies) {
    const otPolicy = await prisma.overtimePolicy.upsert({
      where: {
        workspaceId_name: {
          workspaceId: demoWorkspace.id,
          name: policy.name,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: policy.name,
        description: policy.description,
        rate: policy.rate,
        minimumHours: policy.minimumHours,
        maximumHours: policy.maximumHours,
        requiresApproval: true,
        status: 'ACTIVE',
      },
    });
    console.log(`⏰ Created OT policy: ${otPolicy.name}`);
  }

  // Create approval templates
  const approvalTemplates = [
    {
      name: 'Standard Leave Approval',
      description: 'Standard leave approval process for most employees',
      entityType: 'LEAVE',
      steps: [
        {
          stepNumber: 1,
          approverType: 'DIRECT_MANAGER',
          timeLimit: 24,
        },
        {
          stepNumber: 2,
          approverType: 'DEPARTMENT_HEAD',
          timeLimit: 48,
        },
      ],
    },
    {
      name: 'Standard OT Approval',
      description: 'Standard overtime approval process',
      entityType: 'OVERTIME',
      steps: [
        {
          stepNumber: 1,
          approverType: 'DIRECT_MANAGER',
          timeLimit: 24,
        },
      ],
    },
  ];

  for (const template of approvalTemplates) {
    const approvalTemplate = await prisma.approvalTemplate.upsert({
      where: {
        workspaceId_name: {
          workspaceId: demoWorkspace.id,
          name: template.name,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        name: template.name,
        description: template.description,
        entityType: template.entityType,
        active: true,
      },
    });

    // Create approval steps
    for (const step of template.steps) {
      await prisma.approvalStep.create({
        data: {
          approvalTemplateId: approvalTemplate.id,
          stepNumber: step.stepNumber,
          approverType: step.approverType,
          timeLimit: step.timeLimit,
        },
      });
    }

    console.log(`✅ Created approval template: ${approvalTemplate.name}`);
  }

  // สร้างผู้ใช้ทดสอบเพิ่มเติม
  const regularUsers = [
    {
      email: 'manager@teamo.app',
      name: 'Demo Manager',
      role: 'ADMIN',
      password: 'manager123'
    },
    {
      email: 'user@teamo.app',
      name: 'Demo User',
      role: 'USER',
      password: 'user123'
    }
  ];

  // ค้นหาตำแหน่งงานและแผนกสำหรับใช้สร้างพนักงาน
  const hrDepartment = await prisma.department.findFirst({
    where: { workspaceId: demoWorkspace.id, code: 'HR' }
  });

  const engDept = await prisma.department.findFirst({
    where: { workspaceId: demoWorkspace.id, code: 'ENG' }
  });

  const backendTeam = await prisma.team.findFirst({
    where: { 
      workspaceId: demoWorkspace.id, 
      departmentId: engDept?.id || '',
      name: 'Backend'
    }
  });

  const managerPosition = await prisma.position.findFirst({
    where: { workspaceId: demoWorkspace.id, code: 'TL' }
  });

  const devPosition = await prisma.position.findFirst({
    where: { workspaceId: demoWorkspace.id, code: 'SE' }
  });

  const managerPosLevel = await prisma.positionLevel.findFirst({
    where: { workspaceId: demoWorkspace.id, level: 6 }
  });

  const midLevelPos = await prisma.positionLevel.findFirst({
    where: { workspaceId: demoWorkspace.id, level: 3 }
  });

  for (const userData of regularUsers) {
    const hashedPassword = await hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: 'ACTIVE',
        password: hashedPassword,
      },
    });
    console.log(`👤 Created ${userData.role.toLowerCase()} user:`, user.id);

    // สร้างข้อมูลพนักงาน
    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        userId: user.id,
        employeeCode: userData.role === 'ADMIN' ? 'EMP001' : 'EMP002',
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ')[1] || '',
        email: userData.email,
        phone: '+66891234567',
        hireDate: new Date(),
        probationEndDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        departmentId: userData.role === 'ADMIN' ? hrDepartment?.id : engDept?.id,
        teamId: userData.role === 'USER' ? backendTeam?.id : null,
        positionId: userData.role === 'ADMIN' ? managerPosition?.id : devPosition?.id,
        positionLevelId: userData.role === 'ADMIN' ? managerPosLevel?.id : midLevelPos?.id,
        status: 'ACTIVE',
        employmentType: 'FULL_TIME'
      }
    });
    console.log(`👨‍💼 Created employee for ${userData.role.toLowerCase()}:`, employee.id);

    // เพิ่มเป็นสมาชิกของ workspace
    const workspaceMember = await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: demoWorkspace.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        userId: user.id,
        role: userData.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        status: 'ACTIVE',
      },
    });
    console.log(`🔑 Created workspace member for ${userData.role.toLowerCase()}:`, workspaceMember.id);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 