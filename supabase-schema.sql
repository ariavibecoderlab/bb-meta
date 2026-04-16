-- BB Meta Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CAMPUSES
-- ============================================
CREATE TABLE campuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  address TEXT,
  phone TEXT,
  principal_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin', 'super_admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLASSES
-- ============================================
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT,
  academic_year TEXT,
  teacher_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENTS
-- ============================================
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  campus_id UUID REFERENCES campuses(id),
  class_id UUID REFERENCES classes(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARENT-STUDENT RELATIONSHIP
-- ============================================
CREATE TABLE parent_students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('father', 'mother', 'guardian')),
  is_emergency_contact BOOLEAN DEFAULT false,
  UNIQUE(parent_id, student_id)
);

-- ============================================
-- ATTENDANCE
-- ============================================
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  absence_reason TEXT,
  marked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- ============================================
-- CHAT CONVERSATIONS
-- ============================================
CREATE TABLE chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'class_group', 'campus_broadcast')),
  campus_id UUID REFERENCES campuses(id),
  class_id UUID REFERENCES classes(id),
  title TEXT,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT PARTICIPANTS
-- ============================================
CREATE TABLE chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'voice', 'document', 'system')) DEFAULT 'text',
  attachment_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE READ RECEIPTS
-- ============================================
CREATE TABLE message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================
-- SUBJECTS
-- ============================================
CREATE TABLE subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('montessori', 'islamic', 'academic', 'extracurricular')),
  campus_id UUID REFERENCES campuses(id),
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- STUDENT PERFORMANCE
-- ============================================
CREATE TABLE student_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  term TEXT NOT NULL,
  score NUMERIC(5,2),
  max_score NUMERIC(5,2) DEFAULT 100,
  teacher_notes TEXT,
  status TEXT CHECK (status IN ('on_track', 'behind', 'ahead', 'needs_attention')) DEFAULT 'on_track',
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEEKLY TEACHER UPDATES
-- ============================================
CREATE TABLE weekly_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  student_id UUID REFERENCES students(id),
  teacher_id UUID REFERENCES profiles(id),
  week_start DATE NOT NULL,
  summary TEXT NOT NULL,
  highlights TEXT,
  areas_for_improvement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEARNING PLANS
-- ============================================
CREATE TABLE learning_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  term TEXT NOT NULL,
  goals JSONB DEFAULT '[]',
  overall_status TEXT CHECK (overall_status IN ('on_track', 'behind', 'ahead')) DEFAULT 'on_track',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENT PORTFOLIO (photos, videos, work)
-- ============================================
CREATE TABLE student_portfolio (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  teacher_id UUID REFERENCES profiles(id),
  title TEXT,
  description TEXT,
  media_type TEXT CHECK (media_type IN ('photo', 'video', 'document')) DEFAULT 'photo',
  media_url TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'message', 'performance', 'broadcast', 'alert')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  priority TEXT CHECK (priority IN ('urgent', 'important', 'info')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Parents can only see their own children's data
CREATE POLICY "Parents view own children" ON students
  FOR SELECT USING (
    id IN (SELECT student_id FROM parent_students WHERE parent_id = auth.uid())
  );

-- Teachers can see students in their classes
CREATE POLICY "Teachers view class students" ON students
  FOR SELECT USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Admins can see students in their campus
CREATE POLICY "Admins view campus students" ON students
  FOR SELECT USING (
    campus_id IN (SELECT id FROM campuses WHERE principal_id = auth.uid())
  );

-- Parents view own children's attendance
CREATE POLICY "Parents view own attendance" ON attendance
  FOR SELECT USING (
    student_id IN (SELECT student_id FROM parent_students WHERE parent_id = auth.uid())
  );

-- Teachers manage attendance for their class
CREATE POLICY "Teachers manage class attendance" ON attendance
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()))
  );

-- Chat: participants can view conversations they belong to
CREATE POLICY "Chat participants view" ON chat_conversations
  FOR SELECT USING (
    id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
  );

-- Chat: participants can send messages
CREATE POLICY "Chat participants message" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid())
  );

-- Parents view own children's performance
CREATE POLICY "Parents view performance" ON student_performance
  FOR SELECT USING (
    student_id IN (SELECT student_id FROM parent_students WHERE parent_id = auth.uid())
  );

-- Notifications: users see only their own
CREATE POLICY "Users own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- ENABLE REALTIME FOR CHAT
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;

-- ============================================
-- SEED DATA (1 pilot campus)
-- ============================================
INSERT INTO campuses (id, name, region, address) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'BB Tropicana', 'Petaling Jaya', 'Tropicana, PJ');

INSERT INTO subjects (name, category) VALUES
  ('Practical Life', 'montessori'),
  ('Sensorial', 'montessori'),
  ('Language', 'montessori'),
  ('Mathematics', 'montessori'),
  ('Culture', 'montessori'),
  ('Quran & Hafazan', 'islamic'),
  ('Akhlak', 'islamic'),
  ('Fiqh', 'islamic'),
  ('Arabic Language', 'islamic'),
  ('Art & Craft', 'extracurricular'),
  ('Physical Education', 'extracurricular');
