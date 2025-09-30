import { Plus } from 'lucide-react'

// data
const data = {}

// page title
const titleSection = {
  title: 'Branches',
  description: "Manage your organization's branches",
  button: {
    text: 'Add Branch',
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
}

// context
export const initialAssignmentState = {
  // csv_headers: headers,
  // csv_rows: rows,
  titleSection,
  // screenStats,
  // tableInfo,
  // columns: columns,

  data,
  loading: false,
  error: null,
}
