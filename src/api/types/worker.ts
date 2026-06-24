export interface Story {
  title: string
  project_id: number
  story_id: number
  expect_start_at: string
  expect_end_at: string
  progress: number
}

export interface Worker {
  user_id: number
  name: string
  position: string
  stories: Story[]
}

export interface StoryWithLane extends Story {
  lane: number
}

export interface MonthGroup {
  label: string
  span: number
}
