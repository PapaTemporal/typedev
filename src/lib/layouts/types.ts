/** Physical key identity = KeyboardEvent.code (layout-independent by spec). */
export type PhysicalCode = string;

export type LayoutId = 'qwerty' | 'colemak' | 'colemak-dh' | 'dvorak';

export interface KeyChars {
	base: string;
	shift: string;
}

export interface Layout {
	id: LayoutId;
	label: string;
	keys: Record<PhysicalCode, KeyChars>;
}

export type Finger =
	| 'l-pinky'
	| 'l-ring'
	| 'l-middle'
	| 'l-index'
	| 'thumb'
	| 'r-index'
	| 'r-middle'
	| 'r-ring'
	| 'r-pinky';
