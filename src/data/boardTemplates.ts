import { BoardColumnType, BoardCardPriority } from '@/types/boards';

export interface BoardTemplateColumn {
  title: string;
  type: BoardColumnType;
  isDoneColumn?: boolean;
}

export interface BoardTemplateSuggestedCard {
  headline: string;
  column: string;
  priority?: BoardCardPriority;
  description?: string;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: BoardTemplateColumn[];
  suggestedCards: BoardTemplateSuggestedCard[];
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'grant-application',
    name: 'Grant Application',
    description: 'Track a grant from research to submission',
    icon: 'FileText',
    columns: [
      { title: 'Research', type: 'backlog' },
      { title: 'Drafting', type: 'in_progress' },
      { title: 'Internal Review', type: 'review' },
      { title: 'Ready to Submit', type: 'todo' },
      { title: 'Submitted', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: [
      { headline: 'Review funder guidelines', column: 'Research', priority: 'high' },
      { headline: 'Gather program data and outcomes', column: 'Research' },
      { headline: 'Draft project narrative', column: 'Drafting' },
      { headline: 'Create budget and budget narrative', column: 'Drafting' },
      { headline: 'Collect letters of support', column: 'Drafting' },
      { headline: 'ED review and approval', column: 'Internal Review' },
      { headline: 'Board signature (if required)', column: 'Internal Review' },
      { headline: 'Final proofread', column: 'Ready to Submit' },
      { headline: 'Submit via portal/email', column: 'Ready to Submit' }
    ]
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    description: 'Organize a fundraising event or program',
    icon: 'Calendar',
    columns: [
      { title: 'Ideas', type: 'backlog' },
      { title: 'Planning', type: 'todo' },
      { title: 'In Progress', type: 'in_progress' },
      { title: 'Ready', type: 'review' },
      { title: 'Complete', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: [
      { headline: 'Set event date and venue', column: 'Planning', priority: 'high' },
      { headline: 'Create event budget', column: 'Planning' },
      { headline: 'Design invitations', column: 'Planning' },
      { headline: 'Build guest list', column: 'Planning' },
      { headline: 'Recruit event sponsors', column: 'In Progress' },
      { headline: 'Coordinate catering', column: 'In Progress' },
      { headline: 'Arrange AV equipment', column: 'In Progress' },
      { headline: 'Send invitations', column: 'In Progress' },
      { headline: 'Prepare event program', column: 'In Progress' },
      { headline: 'Confirm RSVPs', column: 'Ready' }
    ]
  },
  {
    id: 'annual-campaign',
    name: 'Annual Fund Campaign',
    description: 'Manage your yearly fundraising campaign',
    icon: 'Heart',
    columns: [
      { title: 'Planning', type: 'backlog' },
      { title: 'Preparation', type: 'todo' },
      { title: 'Active', type: 'in_progress' },
      { title: 'Follow-up', type: 'review' },
      { title: 'Done', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: [
      { headline: 'Set campaign goal and timeline', column: 'Planning', priority: 'high' },
      { headline: 'Segment donor lists', column: 'Planning' },
      { headline: 'Write appeal letter', column: 'Preparation' },
      { headline: 'Design email templates', column: 'Preparation' },
      { headline: 'Prepare social media content', column: 'Preparation' },
      { headline: 'Launch email appeal', column: 'Active' },
      { headline: 'Send direct mail', column: 'Active' },
      { headline: 'Make major donor calls', column: 'Active' },
      { headline: 'Send thank you letters', column: 'Follow-up' },
      { headline: 'Report results to board', column: 'Follow-up' }
    ]
  },
  {
    id: 'board-meeting',
    name: 'Board Meeting Prep',
    description: 'Prepare for and follow up on board meetings',
    icon: 'Users',
    columns: [
      { title: 'To Prepare', type: 'todo' },
      { title: 'In Progress', type: 'in_progress' },
      { title: 'Ready for Meeting', type: 'review' },
      { title: 'Action Items', type: 'todo' },
      { title: 'Complete', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: [
      { headline: 'Draft meeting agenda', column: 'To Prepare', priority: 'high' },
      { headline: 'Prepare financial report', column: 'To Prepare' },
      { headline: 'Prepare program update', column: 'To Prepare' },
      { headline: 'Collect committee reports', column: 'In Progress' },
      { headline: 'Send board packet', column: 'Ready for Meeting' },
      { headline: 'Book meeting room/Zoom', column: 'Ready for Meeting' },
      { headline: 'Take meeting minutes', column: 'Action Items' },
      { headline: 'Distribute minutes', column: 'Action Items' }
    ]
  },
  {
    id: 'program-launch',
    name: 'New Program Launch',
    description: 'Launch a new program or initiative',
    icon: 'Rocket',
    columns: [
      { title: 'Design', type: 'backlog' },
      { title: 'Development', type: 'in_progress' },
      { title: 'Testing', type: 'review' },
      { title: 'Launch', type: 'todo' },
      { title: 'Live', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: [
      { headline: 'Define program goals and outcomes', column: 'Design', priority: 'high' },
      { headline: 'Identify target audience', column: 'Design' },
      { headline: 'Create program budget', column: 'Design' },
      { headline: 'Develop curriculum/content', column: 'Development' },
      { headline: 'Recruit and train staff', column: 'Development' },
      { headline: 'Set up registration system', column: 'Development' },
      { headline: 'Pilot with small group', column: 'Testing' },
      { headline: 'Gather feedback and iterate', column: 'Testing' },
      { headline: 'Marketing and outreach', column: 'Launch' },
      { headline: 'Official program launch', column: 'Launch' }
    ]
  },
  {
    id: 'donor-stewardship',
    name: 'Donor Stewardship',
    description: 'Manage major donor cultivation and stewardship',
    icon: 'Gift',
    columns: [
      { title: 'Identify', type: 'backlog' },
      { title: 'Cultivate', type: 'todo' },
      { title: 'Solicit', type: 'in_progress' },
      { title: 'Steward', type: 'review' },
      { title: 'Renewed', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: [
      { headline: 'Research donor capacity', column: 'Identify', priority: 'high' },
      { headline: 'Schedule introductory meeting', column: 'Cultivate' },
      { headline: 'Send personalized impact report', column: 'Cultivate' },
      { headline: 'Invite to site visit', column: 'Cultivate' },
      { headline: 'Prepare ask amount and case', column: 'Solicit' },
      { headline: 'Make the ask', column: 'Solicit' },
      { headline: 'Send thank you within 48 hours', column: 'Steward' },
      { headline: 'Quarterly impact updates', column: 'Steward' }
    ]
  },
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'Start from scratch with basic columns',
    icon: 'Plus',
    columns: [
      { title: 'To Do', type: 'todo' },
      { title: 'In Progress', type: 'in_progress' },
      { title: 'Done', type: 'done', isDoneColumn: true }
    ],
    suggestedCards: []
  }
];

export const BOARD_COLORS = [
  { name: 'Blue', value: 'hsl(221, 83%, 53%)' },
  { name: 'Green', value: 'hsl(142, 76%, 36%)' },
  { name: 'Purple', value: 'hsl(262, 83%, 58%)' },
  { name: 'Orange', value: 'hsl(24, 94%, 50%)' },
  { name: 'Pink', value: 'hsl(330, 81%, 60%)' },
  { name: 'Teal', value: 'hsl(172, 66%, 50%)' },
  { name: 'Red', value: 'hsl(0, 72%, 51%)' },
  { name: 'Yellow', value: 'hsl(45, 93%, 47%)' }
];
