export const NotificationType = Object.freeze({
	SUCCESS: 'success',
	ERROR: 'error',
	WARNING: 'warning',
	INFO: 'info',
} as const);

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface UINotification {
	readonly id: string;
	readonly type: NotificationType;
	readonly message: string;
	readonly duration?: number;
}

export interface UIState {
	/** Whether the sidebar is open */
	isSidebarOpen: boolean;
	/** Whether the sidebar is in collapsed (icon-only) mode */
	isSidebarCollapsed: boolean;
	/** Which drawer is currently open (e.g., 'user-form', 'role-form'), or null */
	activeDrawer: string | null;
	/** Toast notification queue */
	notifications: UINotification[];
	/** App-wide loading indicator */
	isGlobalLoading: boolean;
}

export const initialUIState: UIState = {
	isSidebarOpen: false,
	isSidebarCollapsed: false,
	activeDrawer: null,
	notifications: [],
	isGlobalLoading: false,
};
