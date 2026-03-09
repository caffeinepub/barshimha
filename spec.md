# Barshimha

## Overview
A full-stack web application for SMLE exam preparation with separate Student and Admin interfaces, featuring question banks, unified study experience, analytics, payment management, and AI-powered study assistance.

## Landing Page
- Welcoming hero section with platform description: "Barshimha is a smart exam preparation platform that transforms 'براشيم' — Arabic for cheat sheets — into powerful learning tools. It offers high-quality questions sourced from accredited references, helping students master concepts, improve recall, and prepare effectively. With an intuitive interface and evidence-based learning methods, Barshimha turns studying into a smarter, more rewarding experience."
- Redesigned brief description section with visually engaging and professional modern layout, typography, and styling to highlight Barshimha's value proposition
- Clear call-to-action buttons: "Subscribe now" button that leads to login and then directs to payment page in student interface, and "Log In/register" buttons
- Mobile-friendly and visually appealing design to create strong first impression
- Pre-authentication landing page accessible to all visitors before login
- Audio player with user controls for the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" that plays exclusively on the landing page
- Visible "Stop Music" button with music note or stop icon that allows users to stop audio playback at any time
- Audio playback controls including play/pause/volume with reliable functionality that always uses the current audio file
- Audio does not auto-play on other pages and is exclusive to the landing page only
- Dynamic logo display using the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo with guaranteed real-time updates and immediate replacement of any default or previous logos
- Logo and audio player must work reliably with proper error handling for missing or corrupted files and immediate refresh when new assets are uploaded

## Authentication & User Management (Version 44 Restored with First User Admin Fix)
- Internet Identity authentication required for all users with restored Version 44 authentication flow
- Authentication workflow, login UI, and session management reverted to Version 44 working state
- All recent changes to login or authentication workflow introduced after Version 44 are removed
- **Critical Fix**: First registered user automatically receives admin role with guaranteed assignment during initial registration process
- Backend must implement robust first-user detection logic that correctly identifies the very first user registration and assigns admin role immediately
- Backend must ensure first user admin assignment occurs only once and cannot be bypassed or overridden by subsequent logic
- Backend must validate and restore admin role to first registered user if previous logic incorrectly assigned student role
- All subsequent users are assigned student role by default
- Backend stores user profiles, roles, and registration timestamps
- Backend must properly validate user authentication and role authorization for all operations
- Authentication system must ensure proper access to landing page and admin panel as in Version 44
- Login process must function exactly as it did in Version 44 without any modifications that affected user access
- First user admin assignment must be atomic and guaranteed to prevent any race conditions or logic errors

## User Roles & Access

### Student Interface
- Access question bank organized by five SMLE domains only
- Unified study page combining study setup and question answering in a single interactive interface
- Study setup section allowing students to select study mode (Practice, Timed, Review), filters (difficulty, domain), randomization options, and question limit before starting session
- Question display section showing questions one by one with Next/Previous navigation, bookmarking functionality, and real-time progress tracking
- For Timed mode, students can set custom time limits or select from preset time options in the study setup
- For Review mode, students can revisit previously answered questions, view explanations, and see which answers were correct or incorrect
- View personal analytics and dashboard with performance metrics including completed questions, accuracy, weak areas, and progress charts
- Student home page displays comprehensive dashboard with backend integration showing student progress
- Progress badges and streaks system to motivate students with backend logic to track and display achievements, updating dynamically based on backend data
- Bookmark questions for later review with backend support to save and retrieve bookmarked questions
- Manage payment status and profile information with subscription status section
- Upload proof of payment for subscription verification with robust file upload functionality including comprehensive error handling and user feedback
- View current payment methods with admin-configured STC Pay barcode and local bank transfer details
- Answer questions and add comments on questions
- Cannot create or edit questions
- Main page displays "Payment Required" message with clickable hyperlink to payment page for students with pending payments
- "Payment Required" message is hidden for students with active subscriptions
- Students with active payment status have immediate access to all questions and study materials without any payment-related restrictions
- "Payment proof uploaded and under review" message is immediately removed when admin approves payment
- All pages display the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo with instant updates when logo changes and immediate replacement of any previous logos
- **Fixed AI Assistant** floating button displayed on the Study page in the bottom-right corner with AI or chat icon
- **Fixed AI Assistant** modal/chat panel that opens when the floating button is clicked
- **Fixed AI Assistant** modal displays a visible chat input area (text field + "Send" button) by default whenever the assistant is opened, without waiting for a greeting or interaction
- **Fixed AI Assistant** chat input area stays fixed at the bottom of the modal with automatic focus when the assistant opens for seamless typing experience
- **Critical Mobile Fix**: Chat input area must be properly anchored above the virtual keyboard on iPhone Safari and all mobile devices with enhanced viewport resize listeners and keyboard-safe layout adjustments
- **Critical Mobile Fix**: Chat input field must remain visible and accessible during typing on all mobile devices with proper keyboard behavior handling using viewport resize detection
- **Critical Mobile Fix**: AI Assistant modal must implement robust viewport resize listeners that detect keyboard open/close events and adjust layout accordingly
- **Critical Mobile Fix**: Chat input area must use keyboard-safe positioning that prevents input field from being hidden behind virtual keyboard on iPhone Safari
- **Critical Mobile Fix**: Modal layout must implement dynamic height adjustments based on viewport changes to maintain input accessibility
- **Critical Mobile Fix**: Chat input field must maintain focus and visibility when virtual keyboard appears with proper scroll adjustments and positioning
- Chat history remains scrollable above the input area
- AI Assistant integrates with DeepSeek's REST API for intelligent responses to student queries
- **Fixed AI Assistant Response Handling**: Backend properly parses DeepSeek API JSON response and extracts text from `choices[0].message.content` field
- **Fixed AI Assistant Response Handling**: Backend returns extracted response text to frontend for display
- **Fixed AI Assistant Error Handling**: Backend implements robust error handling for missing `choices` or `message` fields, returning clear error message "The AI could not process your request. Please try again."
- **Fixed AI Assistant Frontend Display**: Frontend displays actual AI response text received from backend or shows formatted error bubble for any issues
- **Fixed AI Assistant Loading State**: "Thinking..." indicator remains visible until valid reply is received or error message is shown
- AI Assistant UI matches existing theme and is responsive on mobile devices with enhanced iPhone Safari keyboard support
- AI Assistant modal is dismissible with a close button

### Admin Interface
- Full user management capabilities including comprehensive user administration features
- Complete question management (create, read, update, delete)
- Domain Management subsection within Question Management allowing admins to view, add, rename, or delete domains using editable tables or lists
- When domains are renamed, all related questions are automatically updated to reflect the new name throughout the system
- When domains are deleted, admin is prompted to reassign affected questions, mark them as "uncategorized," or choose another action to prevent orphaned questions
- Confirmation prompts before deleting domains to avoid accidental data loss
- Clear feedback to admin on successful edits or errors with real-time updates in the domain management interface
- Bulk question import/export via CSV and TSV
- Question versioning and state management
- Payment management and verification including review of uploaded payment proofs
- Payment Records section that displays all submitted payment proofs from students with guaranteed real-time synchronization
- Payment status approval system allowing admins to mark student payments as "active" with immediate effect across all interfaces
- Payment configuration section to upload STC Pay barcode image and enter local bank transfer details
- Brand management section allowing upload of logo image and audio file for landing page with enhanced reliability and immediate deployment
- Logo upload functionality with secure file storage, proper validation, and guaranteed instant system-wide deployment with immediate replacement of previous logos, defaulting to the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png"
- Audio file upload functionality with secure storage, proper validation, and immediate availability for landing page audio player with automatic replacement of previous audio files, initializing with the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3"
- Revenue analytics and reporting
- Moderate student comments (approve/delete)
- User management dashboard with list of all registered users
- User registration statistics and analytics including total users and new user registration trends over time
- Role management system to assign, update, or revoke user roles and permissions with admin protection
- User activity monitoring with engagement metrics including login frequency, question attempts, and comment activity
- All admin pages display the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo with instant updates when logo changes and immediate replacement of any previous logos
- **Fixed AI Assistant Settings** configuration section in the Admin dashboard menu under "Settings" allowing admins to view and edit the DeepSeek API key, toggle the assistant on/off, and see current status
- **Fixed AI Assistant Settings** management interface using the existing AdminAiConfig.tsx component with clearly labeled buttons for "Enable/Disable Assistant" and "Save API Key"
- **Fixed AI Assistant Settings** configuration settings stored via the existing useSetAiAssistantConfig() hook and displayed via useGetAiAssistantConfig() hook
- **Fixed AI Assistant Settings** configuration section visible only to admin users with proper access controls
- **Fixed First User Admin Access**: Admin menu entries including "AI Assistant Settings" must be immediately visible to the first registered user after login

## AI Assistant System with Full DeepSeek Integration and Enhanced Mobile Support (Critical Mobile Fixes)
- Floating AI Assistant button positioned in bottom-right corner of the Study page with AI or chat icon
- AI Assistant modal/chat panel that opens when the floating button is clicked
- AI Assistant modal displays a visible chat input area (text field + "Send" button) by default whenever the assistant is opened, without waiting for a greeting or interaction
- Chat input area stays fixed at the bottom of the modal and automatically focuses when the assistant opens, providing a seamless typing experience for students
- **Critical Mobile Keyboard Fix**: Enhanced mobile keyboard support with chat input area properly anchored above the virtual keyboard on iPhone Safari and all mobile devices using robust viewport resize listeners
- **Critical Mobile Keyboard Fix**: Viewport resize detection system that automatically detects when virtual keyboard opens/closes and adjusts modal layout accordingly
- **Critical Mobile Keyboard Fix**: Keyboard-safe positioning system that prevents chat input field from being hidden behind virtual keyboard on iPhone Safari
- **Critical Mobile Keyboard Fix**: Dynamic height adjustment system that responds to viewport changes and maintains input field accessibility during keyboard interactions
- **Critical Mobile Keyboard Fix**: Scroll-based repositioning system that adjusts the input field position when virtual keyboard appears to ensure visibility and accessibility
- **Critical Mobile Keyboard Fix**: Proper viewport resizing adjustments that respond to keyboard open/close events on mobile devices with immediate layout updates
- **Critical Mobile Keyboard Fix**: Enhanced focus handling that prevents modal cutoff when keyboard opens and ensures input field remains accessible and visible
- **Critical Mobile Keyboard Fix**: Input field positioning that uses safe area calculations and viewport height adjustments to maintain visibility above virtual keyboard
- Smooth auto-scroll functionality for new messages that maintains proper positioning relative to the keyboard
- Chat history remains scrollable above the input area with proper scroll behavior on mobile devices
- Interactive chat functionality allowing students to send messages and receive AI responses
- Full integration with DeepSeek's REST API at `https://api.deepseek.com/v1/chat` using bearer token authentication
- Backend securely stores and manages DeepSeek API key/token for API authentication
- Backend handles complete API communication with DeepSeek service, sending user messages and retrieving AI responses
- **Fixed DeepSeek Response Parsing**: Backend properly parses DeepSeek API JSON response and extracts text content from `choices[0].message.content` field
- **Fixed DeepSeek Response Handling**: Backend returns extracted response text to frontend for display in chat interface
- **Fixed DeepSeek Error Handling**: Backend implements robust error handling for missing `choices` or `message` fields in API response, returning clear error message "The AI could not process your request. Please try again."
- Chat flow implementation: when student types a message, frontend sends it to backend, backend makes POST request to DeepSeek API with proper payload `{ model: "deepseek-chat", messages: [...] }`, then returns parsed AI response text to frontend for display
- **Fixed Frontend Response Display**: Frontend displays actual AI response text received from backend or shows formatted error bubble if any issue occurs
- **Fixed Loading State Management**: "Thinking..." indicator remains visible until valid reply is received or error message is shown
- Real-time chat functionality with immediate display of AI-generated responses in the chat modal
- Loading state with typing indicator displayed while waiting for AI response
- Comprehensive error handling for API failures, network issues, authentication problems, and response delays
- Graceful handling of API response delays with appropriate user feedback
- Conversation history maintained during the session for continuous conversation context
- Chat history resets when the modal closes to start fresh conversations
- AI Assistant UI matches existing application theme and styling with enhanced mobile responsiveness
- **Critical Mobile Testing**: Responsive design ensuring optimal functionality on mobile devices with special focus on iPhone Safari keyboard behavior and input field accessibility
- Dismissible modal with close button for easy dismissal
- Admin configuration interface for managing DeepSeek API key/token in the Settings section of the Admin dashboard
- Admin interface renders the existing AdminAiConfig.tsx component for AI Assistant configuration
- Admin can view and edit DeepSeek API key, toggle assistant on/off, and see current status through the configuration interface
- Configuration settings use existing useSetAiAssistantConfig() hook for saving and useGetAiAssistantConfig() hook for retrieving settings
- Configuration interface includes clearly labeled "Enable/Disable Assistant" and "Save API Key" buttons
- Secure storage of API credentials with proper encryption and access controls
- System ensures AI Assistant functionality is only available to authenticated students with active payment status

## Enhanced CSV/TSV Question Import System with Intelligent Delimiter Detection
- Admin interface includes dedicated CSV/TSV upload section under Admin Panel > Question Management
- CSV and TSV file upload functionality with comprehensive frontend validation to ensure valid file format and required structure
- Backend implements secure CSV and TSV file processing with parsing, validation, and question extraction capabilities
- Intelligent automatic delimiter detection system that analyzes the first few lines of uploaded files to identify whether the file uses commas, semicolons, or tabs as separators
- Backend must implement robust delimiter detection algorithm that examines file content patterns, character frequency analysis, and row consistency to determine the most appropriate delimiter
- Backend must provide delimiter detection results to frontend with confidence scores and detected delimiter information
- Frontend must display detected delimiter information to admin users during the upload and preview process
- Manual delimiter override functionality in the full-page CSV preview interface allowing admins to manually select the correct delimiter (comma, semicolon, or tab) if auto-detection is incorrect
- Manual delimiter selector must be prominently displayed in the CSV preview interface with clear options for comma, semicolon, and tab delimiters
- When admin changes delimiter manually, the preview must immediately re-parse the CSV/TSV content and update the table display with the new column structure
- Real-time re-parsing functionality that dynamically splits rows into correct columns when delimiter is changed, maintaining all existing preview functionality
- Backend must support delimiter change requests from frontend and re-process CSV/TSV content with the new delimiter while maintaining preview session integrity
- Enhanced delimiter validation ensuring the selected delimiter produces valid column structure and proper data parsing
- Clear error messaging for files with ambiguous or unsupported delimiter patterns with guidance to supported formats
- CSV/TSV field mapping system that adapts to different delimiter types and maps uploaded data to question bank structure including domains, question types, answers, explanations, and difficulty levels
- CSV/TSV format validation ensuring all required fields are present and properly formatted regardless of delimiter type used
- Question data validation during import process to ensure data integrity and compatibility with existing question bank structure after delimiter detection and parsing
- Import progress tracking and detailed feedback system providing clear success/error messages to admin with delimiter detection information
- Error reporting system that identifies specific issues with CSV/TSV data including invalid formats, missing required fields, data inconsistencies, delimiter detection failures, or parsing errors
- Backend must validate CSV/TSV structure, question types, domain mappings, and answer formats after proper delimiter detection and parsing
- Frontend must provide clear upload interface with file validation, delimiter detection feedback, manual override controls, progress indicators, and comprehensive error handling
- Import process must handle large CSV/TSV files efficiently without performance degradation while maintaining accurate delimiter detection
- CSV/TSV import audit logging to track all import operations including delimiter detection results, manual overrides, and maintain data integrity
- Delimiter detection must work seamlessly with existing real-time validation and bulk edit features including add/remove rows and columns, find/replace functionality
- Manual delimiter changes must trigger immediate re-validation of all CSV/TSV content to ensure data integrity and proper column structure
- Preview interface must maintain all enhanced usability features while supporting dynamic delimiter changes and re-parsing

## Enhanced CSV/TSV Preview Authentication and Session Management
- Backend must implement robust preview resource creation system that generates unique preview IDs for each uploaded CSV/TSV file with guaranteed persistence and accessibility
- Backend must implement comprehensive authentication validation for all CSV/TSV preview operations including initial preview creation, preview data retrieval, preview content updates, delimiter detection, manual delimiter changes, and final import approval
- Backend must maintain preview session state with automatic expiration handling and cleanup of expired preview resources
- Backend must validate admin permissions at every step of the CSV/TSV preview workflow including upload, preview access, editing, delimiter changes, and import approval
- Backend must implement preview resource integrity checks to ensure preview data remains consistent and accessible throughout the entire workflow including delimiter changes
- Backend must provide robust error handling for expired preview sessions with clear error codes and messages directing users to re-upload files
- Backend must implement preview resource cleanup mechanisms to automatically remove expired or abandoned preview sessions
- Backend must validate preview ID authenticity and ownership to prevent unauthorized access to preview resources
- Frontend must implement reliable preview ID management ensuring correct preview IDs are consistently passed during navigation to preview pages
- Frontend must maintain authentication state throughout the entire CSV/TSV preview workflow with automatic session validation
- Frontend must implement comprehensive error handling for authentication failures, expired sessions, missing preview data, delimiter detection errors, and permission issues
- Frontend must provide clear user feedback for all error scenarios including session expiration, authentication failures, missing preview resources, and delimiter parsing errors
- Frontend must implement automatic re-authentication prompts when sessions expire during the preview workflow
- Frontend must provide clear guidance for users to re-upload files when preview resources are missing or expired
- Frontend must implement robust navigation state management to ensure seamless transitions between upload and preview interfaces
- Backend must implement atomic preview resource operations ensuring preview creation, updates, delimiter changes, and cleanup are transactionally consistent
- Backend must provide detailed logging for all preview workflow operations including authentication checks, resource access, delimiter detection, and error conditions
- Frontend must implement retry mechanisms for recoverable errors during preview workflow with clear user guidance
- Backend must implement preview resource access control ensuring only the authenticated admin who uploaded the file can access the preview
- Frontend must validate authentication state before attempting to access preview resources with proper error handling for unauthorized access

## Advanced Full-Page CSV/TSV Preview and Editing System with Enhanced Delimiter Management
- After CSV/TSV file upload, users are automatically navigated to a dedicated full-page CSV/TSV preview and editing interface within the admin panel
- Prominent delimiter detection display showing the automatically detected delimiter with confidence information and detection results
- Manual delimiter selector prominently displayed at the top of the preview interface with clear radio buttons or dropdown for comma, semicolon, and tab options
- Real-time delimiter change functionality that immediately re-parses the CSV/TSV content when admin selects a different delimiter
- Dynamic table update that instantly reflects new column structure when delimiter is changed, maintaining all data while reorganizing into proper columns
- Enhanced delimiter validation feedback showing column count changes and parsing results when delimiter is modified
- Expanded workspace layout optimized for large dataset visibility with maximized screen real estate utilization
- Resizable table sections with adjustable column widths and row heights for optimal data viewing
- Comprehensive scrolling support with both horizontal and vertical navigation for efficient handling of large CSV/TSV files
- Persistent column headers that remain visible during vertical scrolling for consistent data reference
- Virtual scrolling implementation to handle large datasets up to 10,000 rows with optimized performance and smooth navigation
- Enhanced inline cell editing with double-click-to-edit activation for intuitive user interaction
- Advanced keyboard navigation supporting Tab key for horizontal movement, Enter key for vertical movement, and arrow keys for directional navigation
- Smooth cell editing experience with automatic focus management and seamless transitions between cells
- Bulk row and column selection with keyboard shortcuts (Ctrl+click, Shift+click) and visual selection indicators
- Context menu actions for selected rows and columns including delete, insert, copy, and paste operations
- Right-click context menus providing quick access to bulk operations and editing functions
- Color-coded validation indicators with distinct visual highlighting for invalid rows, cells, and data entries that update dynamically when delimiter changes
- Enhanced validation tooltips displaying detailed error messages and correction guidance on hover
- Real-time validation feedback with immediate visual updates as users edit cell content or change delimiters
- Live statistics bar displaying comprehensive dataset information including total rows, total columns, detected delimiter, invalid entries count, and unsaved edits counter
- Statistics bar updates in real-time as users make edits, change delimiters, and corrections to the CSV/TSV content
- Performance optimization for large file handling with efficient rendering, memory management, and responsive user interactions
- Professional user interface with improved spacing, enhanced typography, and modern visual design
- Responsive design ensuring optimal functionality across different screen sizes and devices
- Advanced bulk actions toolbar with comprehensive selection management and operation controls
- Find and replace functionality with enhanced search capabilities and pattern matching that works correctly after delimiter changes
- Real-time search highlighting and navigation through search results
- Comprehensive validation system with cell-level error detection and correction guidance that adapts to delimiter changes
- Clear, accessible control buttons for "Approve Import" and "Cancel Import" with prominent placement
- Enhanced error handling with detailed feedback for validation issues, delimiter detection problems, and correction suggestions
- Automatic save indicators showing unsaved changes and edit status
- Backend must support enhanced preview resource management with optimized data retrieval for large datasets and delimiter change operations
- Backend must implement efficient virtual scrolling data endpoints for smooth navigation through large CSV/TSV files
- Backend must provide real-time validation processing with detailed error analysis and correction guidance that adapts to delimiter changes
- Backend must support advanced bulk operations including multi-row/column selection and context menu actions
- Backend must implement optimized search and replace functionality across large CSV/TSV datasets
- Backend must provide live statistics calculation endpoints for real-time dataset information updates including delimiter information
- Backend must handle large file editing operations efficiently with proper memory management and performance optimization
- Backend must implement delimiter change processing that re-parses CSV/TSV content while maintaining session integrity and preview functionality
- Frontend must implement efficient virtual scrolling components with smooth rendering for up to 10,000 rows
- Frontend must implement advanced keyboard navigation with proper focus management and seamless cell transitions
- Frontend must implement responsive bulk selection interface with visual feedback and keyboard shortcuts
- Frontend must implement context menu system with comprehensive bulk operation support
- Frontend must implement real-time validation display with color-coded indicators and detailed tooltips that update when delimiter changes
- Frontend must implement live statistics bar with automatic updates reflecting current dataset state and delimiter information
- Frontend must optimize performance for large dataset handling with efficient state management and rendering
- Frontend must implement delimiter selector interface with immediate re-parsing and table update functionality
- Preview interface must maintain all existing functionality while adding enhanced delimiter management features
- Enhanced interface must support all previous editing capabilities with improved user experience and delimiter flexibility
- Only after admin approval in the enhanced preview interface should the CSV/TSV content be processed and questions added to the Question Bank
- Cancel option must discard the uploaded CSV/TSV without creating any questions or making system changes
- Enhanced preview interface must display clear indicators for required fields, data format expectations, delimiter detection results, and validation status
- Backend must maintain the original uploaded CSV/TSV file structure while allowing temporary modifications and delimiter changes during preview
- CSV/TSV content modifications and delimiter changes in the enhanced preview interface must not recreate or re-upload the file, only update the displayed content for processing
- Backend must not process or store any questions from the CSV/TSV until user explicitly approves the import from the enhanced interface
- Backend must guarantee that no questions are imported into the Question Bank until user approval is given
- Enhanced preview interface must support all existing in-place editing and real-time validation features with improved usability and delimiter management
- Clear feedback system for delimiter detection results and manual override options
- Enhanced full-page interface must provide optimal user experience with smooth interactions, clear visual feedback, responsive design, and intelligent delimiter handling
- Navigation from CSV/TSV upload directly to the enhanced full-page preview interface must be seamless and automatic
- Enhanced preview interface must implement robust authentication state validation with automatic session checks and re-authentication prompts when needed
- Enhanced preview interface must handle missing or expired preview resources gracefully with clear error messages and guidance to re-upload files
- Frontend must implement reliable preview resource access with proper error handling for authentication failures and missing data
- Delimiter change operations must maintain compatibility with all existing bulk edit features including add/remove rows and columns functionality
- Find and replace functionality must work correctly with the current delimiter selection and adapt when delimiter is changed
- Real-time validation must re-run automatically when delimiter is changed to ensure data integrity with new column structure

## Critical Brand Asset Management System
- Admin interface includes dedicated brand management section for uploading and managing logo and audio files with immediate deployment capabilities
- Logo upload functionality with comprehensive file validation, secure storage, and guaranteed instant deployment across all system interfaces with immediate replacement of any default or previous logos, using the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the default main logo
- Audio file upload functionality with comprehensive file validation, secure storage, and immediate availability for landing page audio player with automatic replacement of previous audio files, initializing with the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3"
- Backend must implement robust file upload processing with atomic operations ensuring files are properly saved, validated, and immediately accessible with instant deployment
- Backend must provide reliable endpoints to retrieve current logo and audio files with proper error handling for missing files and immediate serving of newly uploaded assets
- Backend must implement file integrity validation including file type checking, size limits, content verification, and corruption detection
- Logo updates must be reflected instantly across all pages and interfaces without requiring page refresh or user action, completely replacing any previous logos
- Audio file updates must be immediately available on the landing page audio player with proper fallback handling and automatic replacement of previous audio files
- File upload validation must include comprehensive checks for file type, size, format compatibility, and content integrity
- Enhanced error handling for brand asset upload failures with detailed user feedback and recovery options
- Brand asset management interface with ability to view current logo and audio file status, file information, and upload history
- Secure file storage with proper access controls, backup mechanisms, and data integrity verification
- File replacement functionality ensuring old files are properly cleaned up when new ones are uploaded with immediate deployment of new assets
- Upload progress tracking and real-time status updates during file upload process
- Fallback mechanisms for displaying default logo or handling missing audio files gracefully while prioritizing newly uploaded assets
- System must initialize with the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo across all interfaces and the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" for the landing page

## Guaranteed Brand Asset Deployment System
- Backend must implement guaranteed file storage system ensuring uploaded brand assets are never lost or corrupted with immediate deployment capabilities
- Backend must provide atomic file replacement operations ensuring old assets are properly replaced without service interruption and new assets are immediately available
- Backend must implement file verification system to confirm successful upload, storage, and immediate deployment before confirming to admin
- Backend must provide reliable file serving endpoints with proper caching headers, error handling, and immediate serving of newly uploaded assets
- Frontend must implement robust asset loading with retry mechanisms for failed loads and immediate refresh capabilities when new assets are uploaded
- Frontend must implement real-time asset refresh system to immediately display new logo across all interfaces and replace any previous logos without delay
- Frontend must implement reliable audio player with proper error handling for missing or corrupted audio files and automatic loading of newly uploaded audio files
- Backend must maintain file metadata including upload timestamps, file sizes, integrity checksums, and deployment status
- Backend must implement file cleanup procedures to remove old assets when new ones are uploaded with immediate deployment of replacements
- System must provide clear success/failure feedback for all brand asset operations with immediate confirmation of deployment
- Backend must implement file backup and recovery mechanisms to prevent asset loss with immediate restoration capabilities
- Frontend must implement asset cache invalidation to ensure new assets are loaded immediately after upload without browser caching issues
- Backend must provide real-time asset change notifications to trigger immediate frontend updates across all active sessions
- Asset serving endpoints must include proper cache-busting mechanisms to ensure immediate loading of new assets
- System must initialize with the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the default main logo and the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" for the landing page, ensuring both are displayed and available immediately upon system startup

## User Management System
- Backend provides comprehensive user listing functionality for admin access
- User registration statistics tracking including total registered users and registration trends over time periods
- Role management system allowing admins to assign, update, or revoke user roles and permissions with admin role protection
- User activity tracking and engagement metrics including login frequency, question attempt counts, and comment activity
- Backend stores detailed user activity logs and engagement data for analytics
- Admin interface displays user management dashboard with sortable and filterable user lists
- User engagement analytics showing individual and aggregate user behavior patterns

## Admin Role Protection System
- Backend must prevent any admin user from changing their own role from admin to student
- Backend must prevent any admin user from changing another admin user's role from admin to student
- Backend must automatically restore admin role to any user who was mistakenly changed from admin to student during system initialization or recovery
- Role change operations must validate that the target user is not an admin before allowing role modifications
- Frontend must display clear warning messages when attempting to modify admin user roles
- Frontend must block or disable role change controls for admin users in the user management interface
- Only non-admin users (students) can have their roles changed through the role management system
- Backend must maintain audit logs of all role change attempts including blocked admin role modifications

## Question Bank System
- Question types: Multiple choice (single), multiple choice (multi-select), true/false, numeric input
- Rich text support with images and MathJax for mathematical expressions
- Hierarchical organization: Question Bank → Domain
- Question states: Draft, Published, Archived
- Full version history tracking for all questions
- Questions must include difficulty levels for filtering purposes
- Only admins can create, edit, or manage questions

## Domain Management System
- Backend must store and manage domains as editable entities
- Backend must provide endpoints for creating, reading, updating, and deleting domains
- Backend must provide comprehensive endpoints to retrieve all existing domains currently stored in the system
- Backend must provide endpoints to retrieve all existing questions with their associated domain assignments
- Backend must implement cascading updates ensuring when domains are renamed, all related questions are automatically updated throughout the system
- Backend must implement orphan question prevention system that identifies affected questions when domains are deleted
- Backend must provide reassignment options for questions when their associated domains are deleted, including marking as "uncategorized"
- Backend must maintain referential integrity between questions and their domain assignments
- Backend must implement confirmation and validation systems for domain deletion operations
- Backend must provide audit logging for all domain management operations including creation, updates, deletions, and question reassignments
- Admin interface must provide intuitive editable tables or lists for viewing and managing domains
- Admin interface must correctly load and display the current list of all domains from the backend
- Admin interface must load and display all existing questions alongside the domain management interface, allowing admins to view and manage questions in context
- Admin interface must provide real-time feedback for successful operations and clear error messages for failed operations
- Admin interface must implement confirmation prompts before deleting domains to prevent accidental data loss
- Admin interface must provide options for handling affected questions when domains are deleted
- Domain management operations must be restricted to admin users only with proper authorization validation
- Frontend must implement proper data loading mechanisms to ensure all domains and questions are retrieved and displayed correctly in the management interface

## SMLE Domain Structure
- Backend must store the five SMLE domains: Surgery, OBGYN, Internal Medicine, Pediatrics, and Ethics
- Backend must provide endpoints to retrieve all domains
- Questions must be categorized according to these five domains only
- Backend must ensure all five domains are properly stored and accessible through the API
- Domain management system must work with these five domains allowing for custom domains in addition to the predefined SMLE domains

## Add Question Workflow
- Admin interface must include cascading dropdown workflow for adding questions
- Two sequential dropdowns must be completed in order:
  1. Question Bank dropdown (pre-filled with "SMLE" as default and only option)
  2. Domain dropdown (populated with all available domains including the five SMLE domains and custom domains from domain management)
- Admin must select question bank, then domain before accessing question details form
- Backend must store and provide the hierarchical structure of question banks and domains
- Backend must provide reliable endpoints to retrieve all domains for the question bank
- Domain dropdown must correctly display all available domains when question bank is selected
- Question creation is only enabled after both selections are made
- Frontend must implement proper state management for dropdown selections to prevent infinite re-renders and "Maximum update depth exceeded" errors
- Dropdown components must use stable state updates and avoid triggering cascading useEffect loops
- Component logic must be optimized to prevent excessive re-renders during dropdown selection changes

## Unified Study Experience
- Single interactive study page combining study setup and question answering functionality
- Study setup section with options to select study mode (Practice, Timed, Review), apply filters (difficulty, domain), enable randomization, and set question limit
- Immediate session start capability after configuration without page navigation
- Question display section showing questions one by one with Next/Previous navigation buttons
- Real-time progress tracking displaying current question number, total questions, and completion percentage
- Bookmark functionality available on each question with immediate backend synchronization
- Session management maintaining study configuration and progress throughout the session
- Backend must support unified study session creation with all configuration parameters
- Backend must provide efficient question retrieval based on study configuration and filters
- Backend must track session progress and maintain question navigation state
- Backend must handle session completion and statistics updates
- **Fixed AI Assistant** floating button positioned in bottom-right corner with AI or chat icon
- **Fixed AI Assistant** modal/chat panel accessible from the Study page for contextual help with visible chat input area by default and enhanced mobile keyboard support with critical mobile fixes

## Study Modes
- Practice Mode: Unlimited practice with immediate feedback and explanations
- Timed Mode: Exam simulation with time constraints and custom time limit settings configured in study setup
- Review Mode: Review previously answered questions with explanations, showing correct and incorrect answers
- All modes integrated into unified study page with consistent navigation and progress tracking
- Backend must support mode-specific functionality and track performance data for each mode
- Mode selection occurs in study setup section before starting session
- Timed mode includes options for students to set custom time limits or select from preset time options in study setup
- Review mode enables students to revisit previously answered questions and view their answer history

## Question Filtering and Session Management
- Advanced filtering system in study setup allowing students to filter questions by difficulty level and domain
- Randomization option to shuffle question order within filtered results
- Question limit setting to control session length
- Backend must provide efficient question filtering endpoints supporting multiple criteria simultaneously
- Backend must implement session management to maintain study configuration throughout the session
- Backend must handle question retrieval based on filters, randomization, and limit settings
- Session state management ensuring consistent experience during study session
- Backend must optimize question loading for smooth navigation between questions

## Student Progress and Achievement System
- Comprehensive progress tracking including completed questions count, accuracy percentages, and weak domain area identification
- Progress badges system recognizing student achievements and milestones
- Streak tracking system to motivate continuous learning
- Backend must store and calculate progress metrics, badge achievements, and streak data
- Backend must provide endpoints for retrieving student progress data and achievement status
- Achievement system must track various milestones such as consecutive days studied, questions answered, accuracy improvements
- Progress charts and visualizations showing performance trends over time
- Backend must maintain historical progress data for trend analysis
- Progress badges and streaks update dynamically based on backend data

## Study Statistics System
- Backend must track and store detailed study statistics for each student across all study modes (Practice, Timed, Review)
- Backend must maintain separate statistics for each study mode including questions attempted, questions correct, accuracy percentage, time spent, and sessions completed
- Backend must calculate and store aggregate statistics across all study modes for overall performance metrics
- Backend must provide real-time statistics endpoints that return current, up-to-date progress data for each student
- Backend must update statistics immediately when students complete questions or finish study sessions
- Statistics must include mode-specific metrics such as average time per question in Timed mode, review completion rates in Review mode, and practice session frequency
- Backend must track historical statistics data to show progress trends over time for each study mode
- Statistics calculations must be performed server-side to ensure accuracy and consistency
- Backend must provide endpoints for retrieving both current statistics and historical trends for dashboard visualization

## Bookmark System
- Students can bookmark questions for later review directly from the unified study page
- Backend must store bookmarked questions associated with each student profile
- Backend must provide endpoints to save, retrieve, and remove bookmarked questions
- Bookmark functionality integrated into question display with immediate backend synchronization
- Students can access their bookmarked questions through dedicated bookmark section
- Backend must ensure bookmarks persist across user sessions

## Student Dashboard
- Comprehensive dashboard on student home page with backend integration
- "Your Study Statistics" section displaying real, dynamic data reflecting each student's actual progress across different study modes (Practice, Timed, Review)
- Real-time statistics updates that reflect current progress as students complete questions and sessions
- Statistics display must show accurate backend data including questions attempted, accuracy rates, time spent, and sessions completed for each study mode
- Progress charts showing performance trends and improvement over time with real-time data updates
- Achievement badges and current streak display with dynamic updates based on backend data
- Quick access to bookmarked questions
- Performance metrics comparison with overall student population
- Personalized study recommendations based on weak areas
- Backend must provide dashboard data endpoints with comprehensive student analytics and real-time statistics
- Dashboard must automatically refresh statistics when students complete study activities to ensure always up-to-date progress display

## Payment System
- Two payment methods displayed in subscription status section: local bank transfer and STC Bank transfer (barcode)
- Admin can configure payment methods by uploading STC Pay barcode image and entering local bank transfer details
- Students view current payment configuration set by admin in real time
- Students can upload proof of payment (image or PDF files) when selecting a payment method with enhanced secure and reliable file upload functionality
- Backend must implement robust payment proof processing with guaranteed file storage, proper student record linking, immediate visibility in admin Payment Records section, and comprehensive error handling
- Payment receipt generation and storage
- Subscription management with real-time status updates
- Access control: students can only access content after successful payment verification
- Backend tracks payment status, subscription validity, and uploaded payment proofs with mandatory real-time bidirectional synchronization ensuring both student and admin interfaces always reflect identical data states
- Admin payment approval system that immediately updates student payment status to "active" across all interfaces when approved

## Payment Record Management
- Backend must automatically create a payment record for every authenticated student upon first login or registration
- Payment records must be initialized with default pending status and linked to the student's profile
- When students upload payment proofs, the backend must first verify that a payment record exists for the authenticated student
- If no payment record exists, the backend must automatically create one before processing the payment proof upload
- Backend must implement atomic operations that guarantee payment record creation and payment proof linking occur together or both fail
- Payment record lookup must be performed using the authenticated student's identity to ensure proper association
- All payment proof uploads must result in either successful payment record creation/update or clear error messaging explaining the failure
- Backend must maintain referential integrity between student profiles and payment records at all times

## Payment Status Management and Real-Time Updates
- Backend must implement immediate payment status update system when admin approves a student's payment
- When admin marks a student's payment as "active", the backend must instantly update the student's payment status across all systems
- Payment status changes must trigger real-time updates in both admin user management interface and student interface
- Students with "active" payment status must have immediate access to all questions and study materials without any payment-related restrictions
- Backend must ensure payment status updates are atomic and immediately reflected in all user interfaces
- Frontend must implement real-time synchronization to reflect payment status changes without requiring page refresh
- Payment status validation must occur in real-time to control access to study materials and questions
- Admin interface must show updated payment status immediately after approval action
- Student interface must immediately hide "Payment Required" messages and grant full access when payment status becomes "active"
- Student interface must immediately remove "Payment proof uploaded and under review" message when payment status becomes "active"
- Backend must broadcast payment status changes to ensure all active user sessions are immediately updated
- Frontend must implement event listeners or polling mechanisms to detect payment status changes in real-time

## Authentication & Authorization for Payment Proof Uploads
- Backend must implement strict authentication verification for payment proof upload endpoints
- Only authenticated users with student role are authorized to upload payment proofs
- Backend must validate user session and role before processing any payment proof submission
- Clear authorization error messages must be returned for unauthenticated or unauthorized users
- Frontend must handle authentication errors gracefully and guide users to proper login if needed
- Payment proof upload operations must be tied to the authenticated student's profile
- Backend must reject any payment proof upload attempts from non-student users or unauthenticated sessions

## File Upload System Requirements
- Backend must implement atomic file upload operations with transaction rollback capabilities to prevent partial uploads
- File validation must occur before storage including file type verification, size limits, and content integrity checks
- Upload progress tracking and status reporting to provide real-time feedback to students
- Comprehensive error handling for network failures, server errors, file corruption, storage issues, authentication failures, and missing payment records
- Automatic retry mechanisms for failed uploads with exponential backoff
- File storage must guarantee durability and immediate availability for admin review
- Upload confirmation system that verifies successful storage and proper student record association
- Detailed error messages and user-friendly feedback for all failure scenarios including authentication, authorization, and payment record errors
- File upload audit logging for troubleshooting and monitoring
- Authentication state validation before allowing file upload operations

## Enhanced Error Handling for Payment Submissions
- Backend must provide specific error codes and messages for different failure scenarios: authentication failures, authorization issues, missing payment records, file upload errors, and system errors
- Frontend must display clear, actionable error messages that guide students on how to resolve issues
- When payment record is missing, the system must attempt automatic creation before failing
- Error messages must distinguish between temporary issues (retry suggested) and permanent issues (contact support)
- All error states must be logged for admin monitoring and troubleshooting
- Frontend must provide retry mechanisms for recoverable errors
- Success confirmations must clearly indicate that both payment record and proof upload were successful

## Analytics & Dashboard

### Student Dashboard
- Real-time performance metrics including completed questions, accuracy rates, and weak domain areas
- "Your Study Statistics" section with real, dynamic data showing actual progress across Practice, Timed, and Review modes
- Statistics must update in real time as students complete questions and sessions to always show current progress
- Mode-specific statistics display including questions attempted, accuracy percentage, time spent, and sessions completed for each study mode
- Identification of weak domain areas with targeted study recommendations
- Percentile ranking among all students
- Progress charts and statistics showing performance trends over time with real-time data updates
- Performance tracking over time with historical data visualization
- Achievement badges display showing earned milestones and progress with dynamic updates based on backend data
- Current streak display and streak history
- Bookmarked questions quick access section
- Subscription status section showing current payment methods as configured by admin
- Upload status indicators and error notifications for payment proof submissions including authentication and payment record error handling
- Real-time payment status display that immediately reflects admin approval decisions
- Dynamic interface updates that immediately remove payment-related messages when status becomes "active"

### Admin Analytics
- Revenue tracking and financial reports
- User engagement metrics
- Question performance analytics
- Overall platform statistics
- Payment Records section with mandatory real-time display of all uploaded payment proofs with enforced synchronization
- Payment approval interface with immediate status update capabilities that broadcast changes to all user sessions
- Payment configuration management interface
- File upload monitoring and error tracking dashboard
- Payment record integrity monitoring and alerts for missing or orphaned records
- User management analytics including registration statistics, user activity trends, and engagement metrics
- Comprehensive user administration dashboard with role management capabilities and admin protection controls
- Real-time payment status management with immediate effect on student access
- Domain Management analytics showing usage statistics and question distribution across domains
- **Fixed AI Assistant Settings** configuration and management interface in the Settings section of the Admin dashboard
- AI Assistant usage analytics and monitoring

## Data Storage Requirements
- Backend must store: user profiles and roles with comprehensive user management data and admin role protection metadata, **critical first user admin assignment data with guaranteed role assignment logic**, user activity logs and engagement metrics, user registration timestamps and statistics, all questions with metadata, version history, and difficulty levels, complete hierarchical question bank structure with question banks and the five SMLE domains (Surgery, OBGYN, Internal Medicine, Pediatrics, Ethics), custom domains created through domain management system with full CRUD capabilities, domain management audit logs including creation, updates, deletions, and question reassignments, question-to-domain relationship mappings with cascading update support, orphan question prevention data and reassignment history, student progress data including completed questions, accuracy rates, weak areas, and performance trends, detailed study statistics for each student across all study modes with real-time tracking of questions attempted, accuracy rates, time spent, and sessions completed, mode-specific statistics data for Practice, Timed, and Review modes with historical tracking, achievement badges and streak data for each student, bookmarked questions associated with student profiles, study session data including configuration parameters and progress state, payment records and subscription status with enforced data consistency and real-time status updates, uploaded payment proof files with secure storage and mandatory synchronization mechanisms, student performance data and analytics across all study modes, comment moderation queue, payment configuration data including STC Pay barcode image and local bank transfer details, file upload audit logs and error tracking data, role change audit logs including blocked admin role modification attempts, payment status change audit logs with timestamps and admin actions, brand assets including logo images and audio files with enhanced secure storage, guaranteed integrity verification, instant deployment capabilities, immediate replacement of previous assets, proper backup and recovery mechanisms, and real-time asset change tracking, with the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" stored as the default main logo and the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" stored as the default landing page audio, CSV/TSV import audit logs and processing history for question import operations, temporary CSV/TSV content storage for enhanced full-page preview and editing functionality with validation metadata and modification tracking, delimiter detection metadata for uploaded CSV/TSV files including detected delimiter type, confidence scores, and manual override history, enhanced CSV/TSV preview session management with unique preview IDs, session expiration timestamps, authentication state tracking, delimiter detection results, manual delimiter selections, and preview resource integrity validation, bulk operations metadata for enhanced CSV/TSV editing including row/column selection states and modification history, find and replace operation logs and search history for CSV/TSV content, real-time validation results and error metadata for CSV/TSV cells with detailed error descriptions and correction guidance that adapt to delimiter changes, virtual scrolling metadata for large dataset navigation and performance optimization, live statistics data for CSV/TSV preview including row counts, column counts, detected delimiter information, validation status, and edit tracking, enhanced usability metadata for CSV/TSV preview including column width preferences, scroll positions, delimiter selection preferences, and user interface state, AI Assistant configuration data including DeepSeek API key/token with secure encryption and access controls, AI Assistant chat history and session data for maintaining conversation context during active sessions, AI Assistant usage analytics and monitoring data including chat frequency, response times, user engagement metrics, and API call statistics, AI Assistant error logs and troubleshooting data for API failures, authentication issues, network problems, and system errors, AI Assistant conversation metadata including message timestamps, response generation times, and user interaction patterns, **Fixed DeepSeek Response Processing**: AI Assistant response parsing metadata including successful extractions from `choices[0].message.content` field and error handling logs for missing response fields
- Backend must implement atomic operations for payment proof uploads ensuring proper student record association, immediate admin interface updates, and comprehensive error recovery
- Backend must implement atomic operations for payment status updates ensuring immediate synchronization across all interfaces and active user sessions
- Backend must implement real-time statistics tracking that immediately updates when students complete questions or study sessions
- Backend must maintain one-to-one relationship between student profiles and payment records with automatic creation when missing
- Backend must ensure the five SMLE domains are properly stored and accessible alongside custom domains
- Backend must implement efficient indexing for question search and filtering operations
- Backend must store and calculate progress metrics, achievement data, and streak information for each student
- Backend must implement efficient session management for unified study experience
- Backend must implement enhanced brand asset storage with guaranteed file integrity, atomic replacement operations, immediate deployment capabilities, and reliable serving endpoints with instant asset availability, initializing with the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo and the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" for the landing page
- Backend must provide robust brand asset retrieval endpoints with proper error handling, fallback mechanisms, and immediate serving of newly uploaded assets
- Backend must implement secure CSV/TSV file storage and processing capabilities for question import functionality with intelligent delimiter detection and manual override support
- Backend must implement cascading update mechanisms for domain name changes ensuring all related questions are updated automatically
- Backend must implement referential integrity constraints and orphan prevention systems for domain management
- Backend must provide comprehensive data retrieval endpoints for domain management interface to load and display all existing domains and questions
- Backend must implement enhanced CSV/TSV preview session storage system with unique preview IDs, session expiration management, authentication state validation, delimiter detection results, manual delimiter selections, and preview resource integrity checks
- Backend must provide robust endpoints for CSV/TSV preview resource creation, retrieval, updates, delimiter changes, and cleanup with comprehensive authentication validation
- Backend must implement preview session cleanup mechanisms to automatically remove expired or abandoned preview resources
- Backend must not process or store any questions from CSV/TSV until user explicitly approves import from enhanced full-page preview interface
- Backend must implement advanced CSV/TSV content manipulation endpoints supporting bulk row/column operations, find and replace functionality, delimiter change processing, and real-time validation processing with enhanced usability features
- Backend must provide endpoints for bulk selection operations including row and column deletion/addition with proper data integrity validation and enhanced user interface support
- Backend must implement find and replace processing with search pattern matching and content replacement across CSV/TSV data with enhanced search capabilities
- Backend must provide real-time validation endpoints that analyze CSV/TSV cell content and return detailed error information with correction guidance and enhanced visual feedback that adapt to delimiter changes
- Backend must implement virtual scrolling data endpoints for efficient handling of large datasets up to 10,000 rows with optimized performance
- Backend must provide live statistics calculation endpoints for real-time dataset information including row counts, column counts, delimiter information, validation status, and edit tracking
- Backend must implement enhanced usability data storage including column width preferences, scroll positions, delimiter selection preferences, and user interface state for improved user experience
- Backend must implement intelligent delimiter detection algorithms that analyze file content patterns, character frequency, and row consistency to determine optimal delimiter
- Backend must provide delimiter change processing endpoints that re-parse CSV/TSV content with new delimiter while maintaining session integrity
- Backend must store delimiter detection confidence scores and manual override history for audit purposes
- Backend must implement secure AI Assistant API key/token storage with proper encryption and access controls
- Backend must provide endpoints for AI Assistant configuration management restricted to admin users only
- Backend must implement AI Assistant chat session management with conversation history and context maintenance during active sessions
- Backend must handle complete DeepSeek API communication including request formatting with proper payload structure `{ model: "deepseek-chat", messages: [...] }`, bearer token authentication, response processing, and comprehensive error handling
- **Fixed DeepSeek Response Processing**: Backend must properly parse DeepSeek API JSON response and extract text content from `choices[0].message.content` field for display in frontend
- **Fixed DeepSeek Error Handling**: Backend must implement robust error handling for missing `choices` or `message` fields in API response, returning clear error message "The AI could not process your request. Please try again."
- Backend must implement AI Assistant usage tracking and analytics for monitoring chat frequency, response times, user engagement, and API call statistics
- Backend must provide AI Assistant error logging and monitoring for API failures, authentication issues, network problems, and system errors
- Backend must implement chat history reset functionality when AI Assistant modal closes to start fresh conversations
- Backend must provide real-time chat endpoints for processing user messages and returning AI-generated responses
- Backend must implement comprehensive error handling for DeepSeek API failures, network issues, authentication problems, and response delays with graceful degradation
- **Critical First User Admin Storage**: Backend must implement robust first user detection and admin role assignment storage with guaranteed persistence and validation
- Frontend handles: landing page state and navigation to authentication, landing page audio player state with exclusive playback controls and "Stop Music" button functionality, unified study page state including study setup configuration and question display, active study session state with navigation and progress tracking, temporary UI preferences, current question navigation within session, study mode selection and configuration state, custom time limit settings for Timed mode, review mode state for previously answered questions, filter and search interface state within study setup, cascading dropdown state for question creation workflow with optimized state management to prevent infinite re-renders, file upload interface state with enhanced error handling and progress feedback, real-time synchronized updates to Payment Records section in admin interface, upload status tracking and user notifications, user management interface components with admin role protection controls, real-time payment status updates and access control based on current payment status, dynamic message display based on payment status changes, bookmark interface state integrated into question display, dashboard visualization state and progress chart rendering with dynamic badge and streak updates, real-time statistics display with automatic updates when study activities are completed, "Your Study Statistics" section state management with live data synchronization, enhanced brand management interface state for logo and audio file uploads with reliable progress tracking, error handling, and immediate deployment confirmation, dynamic logo display across all pages and interfaces using the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" with instant updates, immediate replacement of previous logos, and proper fallback handling, landing page audio player state and controls with robust error handling, retry mechanisms, and automatic loading of newly uploaded audio files, exclusive landing page audio playback with "Stop Music" button controls, CSV/TSV upload interface state with file validation, progress tracking, and comprehensive error handling for question import functionality, enhanced full-page CSV/TSV preview and editing interface state with robust authentication state validation, automatic session checks, re-authentication prompts, comprehensive error handling for expired sessions and missing preview data, reliable preview resource access with proper error handling, expanded workspace layout with resizable table sections, comprehensive scrolling support with persistent column headers, virtual scrolling implementation for large datasets up to 10,000 rows, enhanced inline cell editing with double-click activation and advanced keyboard navigation, bulk row and column selection with keyboard shortcuts and context menu actions, color-coded validation indicators with enhanced tooltips, live statistics bar with real-time updates, performance optimization for large file handling, professional styling with improved spacing and typography, responsive design optimization, delimiter detection display and manual selector interface with real-time re-parsing functionality, delimiter change processing with immediate table updates and validation re-runs, and efficient state management for smooth user experience with enhanced usability features and intelligent delimiter management, advanced bulk operations interface state including enhanced row and column selection management with keyboard shortcuts, bulk delete/add operation controls with context menus, confirmation dialog states, and operation progress tracking, find and replace toolbar state with enhanced search input management, replacement options, case-sensitive settings, real-time search highlighting, and operation result feedback that works correctly after delimiter changes, real-time validation display state with enhanced cell-level error highlighting, detailed tooltip management, inline message display, color-coded validation indicators, and validation status tracking that adapts to delimiter changes, domain management interface state with editable tables/lists, real-time feedback for CRUD operations, confirmation dialogs for deletion operations, orphan question handling workflows, and proper data loading mechanisms to display all existing domains and questions, virtual scrolling state management for efficient large dataset navigation with smooth performance, live statistics state management for real-time dataset information display including row counts, column counts, delimiter information, and validation tracking, enhanced usability state management including column width preferences, scroll position tracking, delimiter selection preferences, and user interface customization, **Fixed AI Assistant** floating button state and positioning on the Study page, **Fixed AI Assistant** modal/chat panel state management with open/close functionality and conversation history reset when modal closes, **Fixed AI Assistant** chat interface state including message history during active session, input field management, conversation flow, and real-time message display, **Fixed AI Assistant** chat input area state with visible text field and "Send" button displayed by default when assistant opens, automatic focus on input field when assistant opens for seamless typing experience, fixed positioning of input area at bottom of modal with scrollable chat history above, **Critical Mobile Keyboard Fix**: Enhanced mobile keyboard support state with chat input area properly anchored above virtual keyboard on iPhone Safari and all mobile devices using robust viewport resize listeners, **Critical Mobile Keyboard Fix**: Viewport resize detection state that automatically detects when virtual keyboard opens/closes and adjusts modal layout accordingly, **Critical Mobile Keyboard Fix**: Keyboard-safe positioning state that prevents chat input field from being hidden behind virtual keyboard on iPhone Safari, **Critical Mobile Keyboard Fix**: Dynamic height adjustment state that responds to viewport changes and maintains input field accessibility during keyboard interactions, **Critical Mobile Keyboard Fix**: Scroll-based repositioning state for input field when virtual keyboard appears with proper visibility and accessibility management, **Critical Mobile Keyboard Fix**: Enhanced focus handling state that prevents modal cutoff when keyboard opens and ensures input field remains accessible and visible on mobile devices, AI Assistant loading states with typing indicator during API communication with DeepSeek service, **Fixed AI Assistant Response Display**: Frontend state management for displaying actual AI response text received from backend or formatted error bubble for any issues, **Fixed AI Assistant Loading State**: "Thinking..." indicator state management that remains visible until valid reply is received or error message is shown, AI Assistant error handling state for API failures, network issues, authentication problems, and response delays with graceful user feedback, **Fixed AI Assistant Settings** configuration interface state for admin panel with API key management in the Settings section, AI Assistant theme integration state ensuring consistent styling with existing application design, **Critical Mobile Testing**: AI Assistant responsive design state for optimal mobile device functionality with enhanced iPhone Safari keyboard behavior support and input field accessibility verification

## Content Management
- Questions organized in hierarchical structure (Question Bank → Domain)
- Version control for all question modifications
- Bulk operations for question management
- Content moderation system for student comments
- Domain Management system allowing admins to create, read, update, and delete domains with cascading updates to related questions
- Domain Management interface must correctly load and display all existing domains from the backend
- Question management interface must load and display all existing questions alongside domain management, allowing admins to view and manage questions in context with their domain assignments
- Orphan question prevention and reassignment system for domain deletions
- Payment proof file management and verification workflow with secure upload handling, comprehensive error recovery, and enforced synchronization between student and admin interfaces
- Payment status management with real-time approval system and immediate access control updates
- Payment configuration management with real-time updates to student interface
- User management and role administration system with admin role protection
- Enhanced brand asset management including logo and audio file uploads with guaranteed instant system-wide deployment, immediate replacement of previous assets, proper validation, and reliable error handling, using the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo and the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" for the landing page
- Enhanced CSV/TSV question import management with secure file processing, robust authentication validation, comprehensive session management, intelligent delimiter detection, manual delimiter override capabilities, and integration into question bank structure
- Advanced full-page CSV/TSV preview and editing system with enhanced usability features including expanded workspace layout, resizable table sections, comprehensive scrolling support with persistent column headers, virtual scrolling for large datasets up to 10,000 rows, enhanced inline cell editing with double-click activation and advanced keyboard navigation, bulk row and column selection with keyboard shortcuts and context menu actions, color-coded validation indicators with enhanced tooltips, live statistics bar with real-time updates, performance optimization for large file handling, robust authentication state management, automatic session validation, comprehensive error handling for expired sessions and missing preview data, spacious user-friendly interface allowing admins to review, validate, and modify CSV/TSV content with advanced bulk operations, enhanced find and replace functionality, intelligent delimiter detection display, manual delimiter selector with real-time re-parsing, delimiter change processing with immediate table updates and validation re-runs, and real-time validation before final import approval with guaranteed no questions imported until explicit approval
- **Fixed AI Assistant** content management including chat history storage during active sessions, conversation context maintenance, usage analytics, and configuration management
- **Fixed AI Assistant Settings** configuration management for DeepSeek API integration and service parameters in the Settings section of the Admin dashboard
- **Fixed AI Assistant Response Processing**: Content management for properly parsed DeepSeek API responses with extracted text from `choices[0].message.content` field and error handling for missing response fields
- All content in English language

## Security & Access Control
- Role-based access control enforced at backend level for all operations
- Secure API endpoints with proper authorization and authentication validation
- Payment proof upload endpoints must verify user authentication and student role before processing
- Secure file upload handling for payment proofs and payment configuration images with proper validation, file type checking, secure storage, comprehensive error handling, and mandatory synchronization mechanisms
- Enhanced secure brand asset upload handling for logo and audio files with comprehensive validation, file type checking, integrity verification, secure storage with backup mechanisms, guaranteed deployment, and immediate replacement of previous assets
- Enhanced secure CSV/TSV file upload handling for question import with comprehensive validation, file type checking, content verification, secure processing, intelligent delimiter detection, and robust authentication validation throughout the entire workflow
- Advanced secure full-page CSV/TSV preview and editing system with enhanced usability features including comprehensive authentication state validation, automatic session checks, robust error handling for expired sessions and missing preview data, proper validation of modifications, controlled access to temporary CSV/TSV content, preview resource access control, secure bulk operations processing with keyboard shortcuts and context menus, protected find and replace functionality with enhanced search capabilities, secure virtual scrolling implementation for large datasets, protected live statistics calculation, secure delimiter detection and manual override functionality, and protected delimiter change processing with immediate validation re-runs
- Payment verification before content access with real-time status checking
- Admin-only access to sensitive operations, payment proof review, payment status approval, payment configuration management, enhanced brand asset management, enhanced CSV/TSV question import functionality with robust authentication validation, advanced full-page CSV/TSV preview and editing functionality with enhanced usability features including comprehensive session management, bulk operations security with keyboard shortcuts and context menus, secure virtual scrolling for large datasets, protected live statistics tracking, secure delimiter detection and manual override capabilities, and protected delimiter change processing, domain management operations, user management functions, and **Fixed AI Assistant Settings** configuration management in the Settings section
- Clear error messaging for authentication, authorization, payment record failures, expired sessions, delimiter detection errors, missing preview resources, and AI Assistant API failures
- User management operations restricted to admin users only with admin role protection safeguards
- Admin role protection preventing admins from demoting themselves or other admins
- **Critical First User Admin Security**: Enhanced security validation ensuring first registered user receives and maintains admin role with proper access to all admin functions including AI Assistant Settings
- Real-time access control based on current payment status with immediate updates when status changes
- Secure bookmark data access ensuring students can only access their own bookmarked questions
- Progress data privacy ensuring students can only view their own progress and achievement data
- Statistics data security ensuring students can only access their own study statistics and progress data
- Session security ensuring students can only access their own study sessions and progress
- Enhanced brand asset security ensuring only admin users can upload and manage logo and audio files with proper access controls, audit logging, and immediate deployment capabilities
- Enhanced CSV/TSV import security ensuring only admin users can upload and process question import files with comprehensive authentication validation, session management, delimiter detection security, manual override access control, and audit logging throughout the entire preview workflow with enhanced usability features
- Advanced full-page CSV/TSV preview security with enhanced usability features ensuring only admin users can access and modify CSV/TSV content during preview with comprehensive authentication validation, session state management, proper validation, audit logging, secure bulk operations with keyboard shortcuts and context menus, protected find and replace functionality with enhanced search capabilities, secure virtual scrolling implementation, protected live statistics tracking, secure delimiter detection and manual override functionality, and protected delimiter change processing
- Domain management security ensuring only admin users can perform CRUD operations on domains with proper authorization validation and audit logging
- Secure data retrieval for domain management ensuring only authorized admin users can access comprehensive domain and question data
- Landing page audio security ensuring audio files are properly served with appropriate access controls while maintaining public accessibility for landing page visitors
- CSV/TSV preview resource security ensuring only the authenticated admin who uploaded the file can access the preview with proper ownership validation and session management
- Authentication system security ensuring Version 44 authentication flow is properly restored with secure session management and proper access controls
- Enhanced bulk operations security ensuring only authorized admin users can perform row/column deletion/addition operations with keyboard shortcuts and context menus, proper validation and audit logging
- Enhanced find and replace security ensuring search and replacement operations with enhanced capabilities are properly validated and logged with admin-only access controls
- Virtual scrolling security ensuring large dataset navigation is properly secured with admin-only access and proper session validation
- Live statistics security ensuring real-time dataset information is properly protected with admin-only access and secure calculation endpoints
- Delimiter detection security ensuring intelligent delimiter analysis is properly secured with admin-only access and proper validation
- Manual delimiter override security ensuring delimiter change operations are properly secured with admin-only access, proper validation, and audit logging
- **Fixed AI Assistant** security ensuring only authenticated students with active payment status can access the AI Assistant functionality with proper session validation
- **Fixed AI Assistant** API key security with encrypted storage, secure access controls, and admin-only configuration management in the Settings section
- **Fixed AI Assistant** chat data security ensuring students can only access their own chat history during active sessions and conversation data is properly isolated
- **Fixed AI Assistant** API communication security with proper authentication using bearer token, request validation, secure payload formatting, and comprehensive error handling for DeepSeek integration
- **Fixed AI Assistant Settings** secure configuration endpoints restricted to admin users only with proper authorization validation
- **Fixed AI Assistant Response Security**: Secure handling of DeepSeek API responses with proper parsing of `choices[0].message.content` field and secure error handling for missing response fields
- AI Assistant usage data privacy ensuring individual chat analytics are properly protected and anonymized where appropriate
- **Fixed AI Assistant** session security ensuring chat history resets when modal closes and conversation data is properly managed

## Payment Process Synchronization Requirements
- Backend must implement atomic payment proof processing ensuring uploaded files are immediately saved, correctly linked to authenticated student records, and instantly visible in admin Payment Records section with comprehensive error handling and recovery
- Backend must implement atomic payment status approval system ensuring admin approval actions immediately update student payment status across all interfaces and active user sessions
- Authentication validation must occur before any payment proof processing begins
- Payment record existence validation must occur after authentication and before file processing, with automatic creation if missing
- Real-time synchronization engine must guarantee that payment status changes and file uploads are immediately reflected across both student and admin interfaces without any delay, with proper error notification systems
- Backend must maintain transactional consistency for all payment-related operations to prevent data inconsistencies and provide rollback capabilities for failed operations
- Concurrent access handling must ensure multiple users can interact with payment records simultaneously without data corruption
- Enhanced error handling and recovery mechanisms must prevent data loss during payment proof uploads, ensure synchronization integrity, provide detailed user feedback for all failure scenarios including authentication and payment record errors
- Payment status updates must trigger immediate interface refreshes for both student and admin users with proper error state management
- Backend must validate payment proof file integrity, maintain audit trails for all payment-related operations, and provide comprehensive logging for troubleshooting upload failures, authentication issues, and payment record problems
- Frontend must provide clear upload progress indicators, success confirmations, and detailed error messages including authentication, authorization, and payment record errors to guide students through the payment proof submission process
- Payment approval actions must immediately update student access permissions and hide payment-related restrictions in real-time
- Backend must implement notification system to broadcast payment status changes to all active user sessions
- Frontend must implement real-time listeners to detect payment status changes and update interface immediately

## Critical Brand Asset Deployment Requirements
- Backend must implement guaranteed brand asset deployment system ensuring uploaded logo and audio files are immediately available and accessible across all system interfaces with complete replacement of any previous assets
- Backend must implement atomic file replacement operations ensuring old brand assets are properly removed and new assets are immediately deployed without service interruption or data loss
- Logo updates must trigger immediate interface refreshes across all pages without requiring page refresh or user action, completely replacing any default or previous logos
- Audio file updates must be immediately available on the landing page audio player with proper error handling, fallback mechanisms, and automatic replacement of previous audio files
- Backend must provide reliable real-time brand asset endpoints that return current logo and audio file URLs with proper error handling for missing files and immediate serving of newly uploaded assets
- Backend must implement comprehensive file validation including file type verification, size limits, format compatibility, content integrity checks, and corruption detection
- Frontend must implement efficient brand asset loading with retry mechanisms, proper caching invalidation, and fallback handling for failed loads with immediate refresh when new assets are uploaded
- Brand asset changes must be reflected instantly across all active user sessions and interfaces with proper error recovery and complete replacement of previous assets
- Backend must validate brand asset file integrity and provide comprehensive error handling for upload failures with detailed logging
- Frontend must provide clear upload progress indicators, success confirmations, and detailed error messages for brand asset uploads with immediate deployment confirmation
- Brand asset management interface must provide user-friendly feedback for all upload scenarios including success, failure, and recovery states with real-time deployment status
- Backend must implement file cleanup procedures to automatically remove old brand assets when new ones are uploaded with immediate deployment of replacements
- Backend must maintain brand asset metadata including upload timestamps, file sizes, integrity checksums, deployment status, and replacement history
- System must provide clear success/failure feedback for all brand asset operations with proper error recovery mechanisms and immediate deployment confirmation
- Backend must implement brand asset backup and recovery mechanisms to prevent asset loss and ensure system reliability with immediate restoration capabilities
- Frontend must implement asset cache invalidation mechanisms to ensure new brand assets are loaded immediately after upload without browser caching issues
- Backend must provide real-time asset change notifications to trigger immediate frontend updates across all active sessions with complete asset replacement
- Asset serving endpoints must include proper cache-busting mechanisms and versioning to ensure immediate loading of new assets and complete replacement of previous ones
- System must initialize with the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png" as the main logo and the provided audio file "WhatsApp Audio 2025-10-01 at 11.53.26_6ab6ee4b.mp3" for the landing page, ensuring immediate deployment across all interfaces upon system startup

## AI Assistant Integration Requirements with Full DeepSeek Chat Implementation and Critical Mobile Fixes
- Backend must implement complete DeepSeek API integration with secure bearer token authentication using stored API key
- Backend must provide comprehensive endpoints for AI Assistant configuration management restricted to admin users only
- Backend must implement secure storage and retrieval of DeepSeek API key/token with proper encryption and access controls
- Backend must handle complete API communication with DeepSeek service at `https://api.deepseek.com/v1/chat` including proper request formatting with payload structure `{ model: "deepseek-chat", messages: [...] }`, bearer token authentication, response processing, and comprehensive error handling
- **Fixed DeepSeek Response Processing**: Backend must properly parse DeepSeek API JSON response and extract text content from `choices[0].message.content` field for display in frontend
- **Fixed DeepSeek Error Handling**: Backend must implement robust error handling for missing `choices` or `message` fields in API response, returning clear error message "The AI could not process your request. Please try again."
- Backend must implement full chat flow processing: receive user messages from frontend, format requests for DeepSeek API, send POST requests with proper authentication, process AI responses, and return formatted responses to frontend
- Backend must implement AI Assistant chat session management with conversation history and context maintenance during active sessions
- Backend must provide real-time chat endpoints for processing user messages and returning AI-generated responses with immediate display capability
- Backend must implement comprehensive error handling for DeepSeek API failures, network issues, authentication problems, response delays, and rate limiting with graceful degradation
- Backend must implement AI Assistant usage tracking and analytics for monitoring chat frequency, response times, user engagement metrics, and API call statistics
- Backend must provide audit logging for all AI Assistant interactions, API communications, and error conditions
- Backend must implement chat history reset functionality when AI Assistant modal closes to ensure fresh conversations
- Frontend must implement **Fixed AI Assistant** floating button positioned in bottom-right corner of Study page with AI or chat icon
- Frontend must implement **Fixed AI Assistant** modal/chat panel with proper open/close functionality and conversation history reset when modal closes
- Frontend must implement **Fixed AI Assistant** modal with visible chat input area (text field + "Send" button) displayed by default whenever the assistant is opened, without waiting for a greeting or interaction
- Frontend must implement **Fixed AI Assistant** chat input area that stays fixed at the bottom of the modal and automatically focuses when the assistant opens, providing a seamless typing experience for students
- **Critical Mobile Keyboard Fix**: Frontend must implement enhanced mobile keyboard support with chat input area properly anchored above the virtual keyboard on iPhone Safari and all mobile devices using robust viewport resize listeners
- **Critical Mobile Keyboard Fix**: Frontend must implement viewport resize detection system that automatically detects when virtual keyboard opens/closes and adjusts modal layout accordingly
- **Critical Mobile Keyboard Fix**: Frontend must implement keyboard-safe positioning system that prevents chat input field from being hidden behind virtual keyboard on iPhone Safari
- **Critical Mobile Keyboard Fix**: Frontend must implement dynamic height adjustment system that responds to viewport changes and maintains input field accessibility during keyboard interactions
- **Critical Mobile Keyboard Fix**: Frontend must implement scroll-based repositioning system that adjusts the input field position when virtual keyboard appears to ensure visibility and accessibility on mobile devices
- **Critical Mobile Keyboard Fix**: Frontend must implement proper viewport resizing adjustments that respond to keyboard open/close events on mobile devices with immediate layout updates
- **Critical Mobile Keyboard Fix**: Frontend must implement enhanced focus handling that prevents modal cutoff when keyboard opens and ensures input field remains accessible and visible on mobile devices
- **Critical Mobile Keyboard Fix**: Frontend must implement input field positioning that uses safe area calculations and viewport height adjustments to maintain visibility above virtual keyboard
- Frontend must implement smooth auto-scroll functionality for new messages that maintains proper positioning relative to the keyboard
- Frontend must implement scrollable chat history area above the fixed input area with proper scroll behavior on mobile devices
- Frontend must implement complete chat interface with message history during active session, input field management, conversation flow, and real-time message display
- **Fixed Frontend Response Display**: Frontend must display actual AI response text received from backend or show formatted error bubble if any issue occurs
- **Fixed Loading State Management**: Frontend must maintain "Thinking..." indicator until valid reply is received or error message is shown
- Frontend must implement chat flow functionality: when student types message, send to backend, display loading state with typing indicator, receive and display AI-generated response in real-time
- Frontend must implement loading indicators with typing indicator during AI response generation with proper user feedback
- Frontend must implement comprehensive error handling for API failures, network issues, authentication problems, and response delays with clear user messaging and retry options
- Frontend must ensure **Fixed AI Assistant** UI matches existing application theme and styling with consistent design
- **Critical Mobile Testing**: Frontend must implement responsive design for optimal mobile device functionality across all screen sizes with special focus on iPhone Safari keyboard behavior and input field accessibility verification
- Frontend must implement proper state management for chat history during active session and conversation context maintenance
- Frontend must implement dismissible modal with close button and proper cleanup including conversation history reset
- Frontend must implement graceful handling of API response delays with appropriate user feedback and timeout management
- Admin interface must include **Fixed AI Assistant Settings** configuration section in the Settings section of the Admin dashboard menu
- Admin interface must render the existing AdminAiConfig.tsx component for AI Assistant configuration management
- Admin interface must provide secure input field for DeepSeek API key/token with proper validation and storage using existing useSetAiAssistantConfig() hook
- Admin interface must display current AI Assistant configuration status using existing useGetAiAssistantConfig() hook
- Admin interface must include clearly labeled buttons for "Enable/Disable Assistant" and "Save API Key" with proper functionality
- Admin interface must display AI Assistant usage analytics and monitoring information including chat statistics and API performance
- System must ensure **Fixed AI Assistant** functionality is only available to authenticated students with active payment status and proper session validation
- **Fixed AI Assistant** must provide contextual help related to current study questions and learning materials with intelligent responses
- System must maintain conversation context during active chat sessions while resetting history when modal closes for fresh conversations
- **Critical End-to-End Testing**: System must verify on iPhone Safari that AI chat input is visible, responsive, and usable with proper keyboard behavior
- **Critical Admin Access Testing**: System must confirm that the first login correctly initializes as an admin account and displays admin-only menu entries like "AI Assistant Settings"

## Frontend Performance Requirements
- Admin question page components must implement optimized state management to prevent "Maximum update depth exceeded" errors
- Dropdown selection logic must use stable state updates and avoid triggering infinite useEffect loops
- Component re-rendering must be minimized through proper dependency management in useEffect hooks
- Cascading dropdown components must handle state changes efficiently without causing excessive re-renders
- Frontend must implement proper error boundaries and state validation to prevent infinite update cycles
- All interactive components must be optimized for smooth user experience without performance issues
- Domain dropdown components must handle selection changes properly without causing performance issues
- Real-time payment status updates must be implemented efficiently without causing performance degradation
- Payment status synchronization must use optimized state management to prevent unnecessary re-renders
- Real-time event listeners for payment status changes must be implemented efficiently to avoid performance issues
- Filter and search components must be optimized for responsive user interaction without performance lag
- Dashboard components must efficiently render progress charts and achievement data without performance issues
- Real-time statistics updates must be implemented efficiently to prevent performance issues when data changes
- "Your Study Statistics" section must use optimized state management for real-time data synchronization without causing excessive re-renders
- Bookmark functionality must be implemented with optimized state management for smooth user experience
- Unified study page must be implemented with efficient state management for study setup and question display without performance issues
- Question navigation (Next/Previous) must be optimized for smooth transitions without performance lag
- Progress tracking display must be implemented efficiently with real-time updates without causing performance issues
- Session management must use optimized state handling to maintain study configuration and progress efficiently
- Landing page must be optimized for fast loading and smooth user experience across all devices
- Landing page audio player must be implemented with efficient audio loading, playback controls, error handling, and "Stop Music" button functionality without performance issues
- Audio player state management must be optimized to handle exclusive landing page playback without affecting other pages
- Enhanced brand asset loading must be implemented efficiently to prevent performance issues when logo or audio files are updated with proper retry mechanisms, fallback handling, and immediate asset replacement
- Dynamic logo display must use optimized state management to prevent unnecessary re-renders across all interfaces with efficient caching invalidation and immediate replacement of previous logos, using the provided logo image "5d0a4fad-307b-4b30-8c10-dd200e46e3f2.png"
- Brand asset refresh mechanisms must be implemented efficiently to provide instant updates and complete asset replacement without causing performance degradation
- CSV/TSV upload interface must be implemented with efficient file handling, validation, and progress tracking without performance issues
- CSV/TSV processing feedback must be implemented efficiently to provide real-time status updates without causing performance degradation
- Enhanced full-page CSV/TSV preview and editing interface with enhanced usability features must be implemented with efficient large table rendering using virtual scrolling for up to 10,000 rows, responsive design with expanded workspace layout, comprehensive scrolling support with persistent column headers, optimized editing capabilities with double-click activation and advanced keyboard navigation, robust authentication state management, automatic session validation, comprehensive error handling for expired sessions and missing preview data, reliable preview resource access, advanced bulk operations interface with efficient row/column selection management using keyboard shortcuts and context menus, enhanced find and replace toolbar with optimized search functionality and real-time highlighting, live statistics bar with real-time updates, real-time validation display, delimiter detection display and manual selector interface with efficient re-parsing functionality, delimiter change processing with immediate table updates and validation re-runs, and optimized state management without performance degradation
- Enhanced full-page CSV/TSV preview interface state management must be optimized to handle real-time editing with enhanced usability features, validation feedback with color-coded indicators, professional styling with improved spacing and typography, approval workflow, authentication state validation, session management, error handling, bulk operations processing with keyboard shortcuts and context menus, enhanced find and replace functionality with real-time search highlighting, advanced validation display with detailed tooltips, virtual scrolling for large datasets, live statistics tracking, delimiter detection and manual override functionality, and delimiter change processing without performance issues
- Virtual scrolling implementation must be optimized for smooth navigation through large datasets up to 10,000 rows with efficient rendering and memory management
- Enhanced bulk operations interface must be implemented with efficient selection management using keyboard shortcuts, operation processing with context menus, and user feedback without performance lag
- Enhanced find and replace functionality must be optimized for fast search processing with real-time highlighting, pattern matching, and content replacement across large CSV/TSV files without performance issues
- Real-time validation display with enhanced usability must be implemented efficiently to provide instant cell-level feedback with color-coded indicators, error highlighting, detailed tooltip management, and validation status updates that adapt to delimiter changes without causing performance degradation
- Live statistics bar must be implemented efficiently to provide real-time dataset information including row counts, column counts, delimiter information, validation status, and edit tracking without performance impact
- Asset cache invalidation must be implemented efficiently to ensure immediate loading of new brand assets without performance impact
- Real-time asset change detection must be optimized to provide instant updates across all interfaces without performance degradation
- Domain management interface must be implemented with efficient state management for editable tables/lists, real-time updates, and CRUD operations without performance issues
- Domain management interface must implement efficient data loading mechanisms to retrieve and display all existing domains and questions without performance degradation
- Question management interface must be optimized to load and display all existing questions alongside domain management without performance issues
- Confirmation dialogs and orphan question handling workflows must be optimized for smooth user experience without performance lag
- Enhanced full-page interface components must be implemented with efficient responsive design, expanded workspace layout with resizable sections, and smooth user interactions without performance issues
- Navigation from CSV/TSV upload to enhanced full-page preview interface must be optimized for seamless and automatic transitions without performance lag
- Authentication state validation and session management must be implemented efficiently without causing performance issues during enhanced CSV/TSV preview workflow
- Error handling for expired sessions and missing preview resources must be optimized to provide smooth user experience without performance degradation
- Authentication system must be optimized for Version 44 performance standards with efficient login processing and session management
- Enhanced bulk selection interface with keyboard shortcuts must be implemented with efficient checkbox management, multi-selection handling, and operation confirmation without performance issues
- Enhanced find and replace toolbar with real-time highlighting must be optimized for responsive search input, real-time pattern matching, and efficient replacement operations without performance lag
- Enhanced cell-level validation feedback with color-coded indicators must be implemented efficiently to provide instant error highlighting, detailed tooltip display, and validation status updates that adapt to delimiter changes without causing performance degradation
- Persistent column headers during scrolling must be implemented efficiently without affecting scroll performance or causing layout issues
- Resizable table sections must be implemented with smooth resizing capabilities and efficient state management without performance impact
- Context menu actions must be implemented with fast response times and efficient operation processing without performance lag
- Enhanced keyboard navigation must be optimized for smooth cell transitions, efficient focus management, and responsive user interaction without performance issues
- Delimiter detection display must be implemented efficiently with clear visual feedback and real-time updates without performance impact
- Manual delimiter selector must be optimized for responsive user interaction with immediate re-parsing functionality without performance lag
- Delimiter change processing must be implemented efficiently to provide instant table updates, column restructuring, and validation re-runs without performance degradation
- Real-time re-parsing functionality must be optimized to handle delimiter changes smoothly with efficient data processing and immediate visual updates without performance issues
- **Fixed AI Assistant** floating button must be implemented with efficient positioning and state management without affecting Study page performance
- **Fixed AI Assistant** modal/chat panel must be optimized for smooth open/close animations, efficient rendering, and conversation history reset functionality without performance lag
- **Fixed AI Assistant** chat interface must be implemented with efficient message handling, conversation history management during active sessions, real-time message display, and optimized state management without performance issues
- **Fixed AI Assistant** chat input area must be implemented with efficient state management for visible text field and "Send" button displayed by default, automatic focus functionality when assistant opens, and fixed positioning at bottom of modal without performance impact
- **Critical Mobile Performance**: **Fixed AI Assistant** enhanced mobile keyboard support must be implemented efficiently with chat input area properly anchored above virtual keyboard, viewport resize detection system, keyboard-safe positioning system, dynamic height adjustment system, scroll-based repositioning system, viewport resizing adjustments, enhanced focus handling, and input field positioning using safe area calculations without performance degradation on iPhone Safari and all mobile devices
- **Fixed AI Assistant** scrollable chat history area must be implemented efficiently above the fixed input area with smooth scrolling performance and proper memory management on mobile devices
- **Fixed AI Assistant** API communication must be optimized with proper loading states including typing indicator, error handling, response processing, and real-time chat flow without blocking user interface
- **Fixed AI Assistant Response Performance**: Frontend must efficiently display actual AI response text received from backend or show formatted error bubble without performance impact
- **Fixed AI Assistant Loading Performance**: "Thinking..." indicator state management must be optimized to remain visible until valid reply is received or error message is shown without performance issues
- **Fixed AI Assistant** state management must be implemented efficiently to handle chat history during active sessions, conversation context maintenance, modal state management, input area state, automatic focus management, enhanced mobile keyboard behavior, and history reset when modal closes without causing performance degradation
- **Critical Mobile Testing Performance**: **Fixed AI Assistant** responsive design must be optimized for smooth functionality across different screen sizes without performance impact, with special focus on iPhone Safari keyboard behavior and input field accessibility verification
- **Fixed AI Assistant** theme integration must be implemented efficiently without affecting overall application styling performance
- **Fixed AI Assistant Settings** configuration interface in the Settings section must be implemented with efficient state management for AdminAiConfig.tsx component rendering without performance issues
- **Fixed AI Assistant Settings** configuration state management must be optimized for useSetAiAssistantConfig() and useGetAiAssistantConfig() hook operations without causing performance degradation
- **Fixed AI Assistant** chat flow performance must be optimized for real-time message sending, API communication, response processing, and display without causing interface lag or blocking
- **Fixed AI Assistant** error handling must be implemented efficiently with proper user feedback, retry mechanisms, and graceful degradation without affecting overall application performance
- **Critical Mobile Keyboard Performance**: **Fixed AI Assistant** mobile keyboard handling must be optimized for smooth virtual keyboard interactions, proper input field positioning, scroll adjustments, focus management, viewport resize detection, keyboard-safe positioning, dynamic height adjustments, and enhanced focus handling without performance issues on iPhone Safari and all mobile devices
