# MinuteMate - Professional Services Booking Platform

MinuteMate is a comprehensive web application that connects service seekers with verified professionals for short-duration consultations. The platform supports three user roles: seekers (clients), providers (professionals), and admins.

## 🚀 Features

### For Seekers (Clients)
- Browse and search verified professionals by category
- View detailed professional profiles with reviews and ratings
- Book sessions with real-time availability checking
- Manage bookings and leave reviews
- Digital wallet system for payments
- Real-time notifications

### For Providers (Professionals)
- Professional dashboard with earnings and session analytics
- Availability management with time slots and blocked dates
- Session management and client communication
- Verification system for professional credentials
- Earnings tracking and payout management
- Customizable session settings (buffer time, advance booking rules)

### For Admins
- Platform overview dashboard with key metrics
- User management (suspend/activate accounts)
- Professional verification approval workflow
- System-wide monitoring and analytics

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **State Management**: React hooks and Server Components
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)

You'll also need accounts for:
- [Clerk](https://clerk.com) (Authentication)
- [Supabase](https://supabase.com) (Database)

## 🚀 Getting Started

### Step 1: Clone and Install Dependencies

\`\`\`bash
# Navigate to your project directory
cd minutemate

# Install dependencies
npm install
\`\`\`

### Step 2: Set Up Supabase Database

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Set Up Database Schema**
   
   In your Supabase SQL Editor, run these scripts in order:

   **a) Create the main tables:**
   \`\`\`sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     clerk_id TEXT UNIQUE NOT NULL,
     email TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('seeker', 'provider', 'admin')),
     balance DECIMAL(10,2) DEFAULT 0.00,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Professional profiles table
   CREATE TABLE professional_profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     bio TEXT,
     credentials TEXT,
     experience TEXT,
     category TEXT NOT NULL,
     rate_per_15min DECIMAL(8,2) NOT NULL,
     is_verified BOOLEAN DEFAULT false,
     average_rating DECIMAL(3,2) DEFAULT 0.00,
     total_reviews INTEGER DEFAULT 0,
     total_sessions INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Availability slots table
   CREATE TABLE availability_slots (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
     day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
     start_time TIME NOT NULL,
     end_time TIME NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Bookings table
   CREATE TABLE bookings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     seeker_id UUID REFERENCES users(id) ON DELETE CASCADE,
     professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
     scheduled_date DATE NOT NULL,
     start_time TIME NOT NULL,
     duration_minutes INTEGER NOT NULL,
     total_amount DECIMAL(8,2) NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Sessions table
   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
     seeker_id UUID REFERENCES users(id) ON DELETE CASCADE,
     professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
     started_at TIMESTAMP WITH TIME ZONE,
     ended_at TIMESTAMP WITH TIME ZONE,
     status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
     actual_duration_minutes INTEGER,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Reviews table
   CREATE TABLE reviews (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
     seeker_id UUID REFERENCES users(id) ON DELETE CASCADE,
     professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
     rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
     comment TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Transactions table
   CREATE TABLE transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
     type TEXT NOT NULL CHECK (type IN ('payment', 'payout', 'add_funds', 'refund')),
     amount DECIMAL(10,2) NOT NULL,
     description TEXT,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Notifications table
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     message TEXT NOT NULL,
     type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'system', 'review')),
     is_read BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   \`\`\`

   **b) Create verification system tables:**
   \`\`\`sql
   -- Verification requests table
   CREATE TABLE verification_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     professional_title TEXT NOT NULL,
     credentials TEXT NOT NULL,
     experience_years INTEGER NOT NULL,
     portfolio_url TEXT,
     linkedin_url TEXT,
     additional_info TEXT,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
     admin_notes TEXT,
     reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
     reviewed_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   \`\`\`

   **c) Create availability system tables:**
   \`\`\`sql
   -- Blocked dates table
   CREATE TABLE blocked_dates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE,
     blocked_date DATE NOT NULL,
     reason TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(professional_id, blocked_date)
   );
   \`\`\`

   **d) Create provider settings table:**
   \`\`\`sql
   -- Session settings table
   CREATE TABLE session_settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     professional_id UUID REFERENCES professional_profiles(id) ON DELETE CASCADE UNIQUE,
     buffer_time_minutes INTEGER DEFAULT 15,
     max_advance_booking_days INTEGER DEFAULT 30,
     min_advance_booking_hours INTEGER DEFAULT 24,
     auto_accept_bookings BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   \`\`\`

3. **Insert Sample Data**
   
   Run this script to populate your database with sample data for testing:
   \`\`\`sql
   -- Insert sample users
   INSERT INTO users (id, clerk_id, email, name, role, balance) VALUES
   ('550e8400-e29b-41d4-a716-446655440001', 'clerk_user_1', 'sarah.johnson@example.com', 'Sarah Johnson', 'provider', 500.00),
   ('550e8400-e29b-41d4-a716-446655440002', 'clerk_user_2', 'michael.chen@example.com', 'Michael Chen', 'provider', 750.00),
   ('550e8400-e29b-41d4-a716-446655440003', 'clerk_user_3', 'lisa.williams@example.com', 'Lisa Williams', 'provider', 300.00),
   ('550e8400-e29b-41d4-a716-446655440004', 'clerk_user_4', 'jason.thompson@example.com', 'Jason Thompson', 'seeker', 1200.00),
   ('550e8400-e29b-41d4-a716-446655440005', 'clerk_user_5', 'emily.johnson@example.com', 'Emily Johnson', 'seeker', 800.00),
   ('550e8400-e29b-41d4-a716-446655440006', 'clerk_user_6', 'admin@minutemate.com', 'Admin User', 'admin', 0.00);

   -- Insert professional profiles
   INSERT INTO professional_profiles (id, user_id, title, bio, credentials, experience, category, rate_per_15min, is_verified, average_rating, total_reviews, total_sessions) VALUES
   ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Legal Consultant', 'Corporate lawyer with 10+ years of experience specializing in contract review, business law, and startup advisory.', 'J.D. from Harvard Law School. Member of the American Bar Association.', 'Previously worked at Wilson Sonsini Goodrich & Rosati and in-house counsel at a tech startup.', 'Legal', 75.00, true, 4.8, 47, 52),
   ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'UX/UI Designer', 'Product designer focused on creating intuitive user experiences. Previously worked at Google and Airbnb.', 'Bachelor''s in Design from RISD. Certified UX Professional (CUXP).', 'Senior UX Designer at Google (2018-2022). Product Designer at Airbnb (2015-2018).', 'Design', 60.00, true, 4.9, 38, 45),
   ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Career Coach', 'Certified career coach helping professionals navigate career transitions and job searches.', 'Certified Professional Career Coach (CPCC). Former HR Director.', '15 years in HR and talent acquisition. Helped 200+ professionals advance their careers.', 'Coaching', 50.00, true, 4.7, 29, 34);

   -- Insert availability slots
   INSERT INTO availability_slots (professional_id, day_of_week, start_time, end_time) VALUES
   ('650e8400-e29b-41d4-a716-446655440001', 1, '09:00', '12:00'),
   ('650e8400-e29b-41d4-a716-446655440001', 1, '13:00', '17:00'),
   ('650e8400-e29b-41d4-a716-446655440001', 2, '09:00', '12:00'),
   ('650e8400-e29b-41d4-a716-446655440001', 2, '13:00', '17:00');

   -- Insert sample bookings
   INSERT INTO bookings (id, seeker_id, professional_id, scheduled_date, start_time, duration_minutes, total_amount, status) VALUES
   ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', '10:00', 30, 150.00, 'confirmed');

   -- Insert sample sessions
   INSERT INTO sessions (booking_id, seeker_id, professional_id, started_at, ended_at, status, actual_duration_minutes) VALUES
   ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '30 minutes', 'scheduled', NULL);

   -- Insert sample notifications
   INSERT INTO notifications (user_id, title, message, type) VALUES
   ('550e8400-e29b-41d4-a716-446655440004', 'Booking Confirmed', 'Your session with Sarah Johnson has been confirmed for tomorrow at 10:00 AM.', 'booking');
   \`\`\`

### Step 3: Set Up Clerk Authentication

1. **Create a Clerk Application**
   - Go to [clerk.com](https://clerk.com)
   - Create a new application
   - Choose "Email" and "Password" as sign-in methods
   - Note your publishable key and secret key

2. **Configure Clerk Settings**
   - In your Clerk dashboard, go to "User & Authentication" → "Email, Phone, Username"
   - Enable email addresses
   - Set up your sign-in and sign-up flows

### Step 4: Environment Variables

1. **Copy the environment template:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Fill in your environment variables in \`.env.local\`:**
   \`\`\`env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
   CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

### Step 5: Run the Application

\`\`\`bash
# Start the development server
npm run dev
\`\`\`

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Application

### Test User Accounts

You can create test accounts or use the sample data:

**Sample Users (if using sample data):**
- **Provider**: sarah.johnson@example.com
- **Seeker**: jason.thompson@example.com  
- **Admin**: admin@minutemate.com

**Note**: These are database entries only. You'll need to create actual Clerk accounts with these emails to sign in.

### Testing Workflow

1. **Sign up as a new user**
2. **Complete onboarding** (choose role: seeker, provider, or admin)
3. **Test seeker flow**: Browse professionals, book sessions, manage wallet
4. **Test provider flow**: Set availability, manage sessions, track earnings
5. **Test admin flow**: Manage users, approve verifications

## 📁 Project Structure

\`\`\`
minutemate/
├── app/
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── seeker/           # Seeker-specific pages
│   │   ├── provider/         # Provider-specific pages
│   │   └── admin/            # Admin-specific pages
│   ├── auth/                 # Authentication pages
│   ├── onboarding/           # User onboarding flow
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── dashboard-nav.tsx     # Dashboard navigation
│   ├── main-nav.tsx          # Main navigation
│   └── user-nav.tsx          # User navigation dropdown
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   ├── database.types.ts     # TypeScript database types
│   └── utils.ts              # Utility functions
├── hooks/
│   └── use-user.ts           # User data hook
└── middleware.ts             # Clerk middleware for auth
\`\`\`

## 🔧 Key Features Implementation

### Authentication Flow
- Clerk handles authentication
- Custom middleware protects routes
- User data synced with Supabase
- Role-based access control

### Database Operations
- All CRUD operations use Supabase
- Real-time subscriptions for notifications
- Transaction management for payments
- Optimistic updates for better UX

### Payment System
- Digital wallet with balance tracking
- Transaction history and receipts
- Automatic balance deduction for bookings
- Provider payout calculations

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy on Vercel**
   - Connect your GitHub repository to Vercel
   - Add your environment variables in Vercel dashboard
   - Deploy automatically

3. **Update Environment Variables**
   - Update \`NEXT_PUBLIC_APP_URL\` to your Vercel domain
   - Update Clerk and Supabase settings with production URLs

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check if tables are created correctly
   - Ensure RLS policies are set up if needed

2. **Authentication Issues**
   - Verify Clerk keys are correct
   - Check if middleware is properly configured
   - Ensure user roles are set correctly

3. **Build Errors**
   - Run \`npm run build\` locally to test
   - Check for TypeScript errors
   - Verify all environment variables are set

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Clerk documentation](https://clerk.com/docs)
- Check [Supabase documentation](https://supabase.com/docs)

## 📝 Next Steps

After getting the basic application running, consider:

1. **Add real payment processing** (Stripe integration)
2. **Implement video calling** (for remote sessions)
3. **Add email notifications** (Resend or similar)
4. **Enhance the admin dashboard** with more analytics
5. **Add mobile responsiveness** improvements
6. **Implement file upload** for verification documents
7. **Add search and filtering** enhancements
8. **Set up monitoring** and error tracking

## 📄 License

This project is for educational/development purposes. Please ensure you comply with all third-party service terms of use.
