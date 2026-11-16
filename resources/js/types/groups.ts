export type GroupRole = 'owner' | 'admin' | 'member';
export type GroupPage<T> = {
    data: T[];
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
export type GroupMember = {
    id: number;
    name: string;
    role: GroupRole;
    canRemove: boolean;
};
export type GroupPost = {
    id: number;
    author: string;
    body: string | null;
    reference: string;
    url: string;
    createdAt: string;
    removed: boolean;
    removedByModerator: boolean;
    canRemove: boolean;
};
export type SharedGroupPlan = {
    id: number;
    name: string;
    currentDay: number;
    totalDays: number;
    complete: boolean;
    readings: { reference: string; url: string; isRead: boolean }[];
    checkedIn: boolean;
    checkins: { name: string }[];
    canCheckIn: boolean;
};
