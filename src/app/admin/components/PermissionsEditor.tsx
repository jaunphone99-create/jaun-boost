'use client';

import { StaffPermissions, PermissionAction } from '@/lib/types';
import { PERMISSION_GROUPS, ACTION_LABELS, getDefaultPermissions } from '@/lib/permissions';

interface PermissionsEditorProps {
    permissions: StaffPermissions;
    onChange: (permissions: StaffPermissions) => void;
}

export default function PermissionsEditor({ permissions, onChange }: PermissionsEditorProps) {

    function isChecked(pageId: string, action: PermissionAction): boolean {
        return permissions[pageId]?.includes(action) ?? false;
    }

    function toggleAction(pageId: string, action: PermissionAction) {
        const current = permissions[pageId] || [];
        let updated: PermissionAction[];

        if (current.includes(action)) {
            // Unchecking: if unchecking 'view', remove all actions
            if (action === 'view') {
                updated = [];
            } else {
                updated = current.filter(a => a !== action);
            }
        } else {
            // Checking: if checking 'edit' or 'delete', auto-check 'view'
            if (action !== 'view' && !current.includes('view')) {
                updated = [...current, 'view', action];
            } else {
                updated = [...current, action];
            }
        }

        const newPerms = { ...permissions };
        if (updated.length === 0) {
            delete newPerms[pageId];
        } else {
            newPerms[pageId] = updated;
        }
        onChange(newPerms);
    }

    function togglePage(pageId: string, allActions: PermissionAction[]) {
        const current = permissions[pageId] || [];
        const newPerms = { ...permissions };
        if (current.length === allActions.length) {
            // Uncheck all
            delete newPerms[pageId];
        } else {
            // Check all
            newPerms[pageId] = [...allActions];
        }
        onChange(newPerms);
    }

    function applyPreset(preset: 'all' | 'viewOnly' | 'none') {
        if (preset === 'all') {
            onChange(getDefaultPermissions('admin'));
        } else if (preset === 'viewOnly') {
            const perms: StaffPermissions = {};
            PERMISSION_GROUPS.forEach(g => g.pages.forEach(p => {
                perms[p.id] = ['view'];
            }));
            onChange(perms);
        } else {
            onChange({});
        }
    }

    // Split groups into 2 columns
    const midpoint = Math.ceil(PERMISSION_GROUPS.length / 2);
    const leftGroups = PERMISSION_GROUPS.slice(0, midpoint);
    const rightGroups = PERMISSION_GROUPS.slice(midpoint);

    return (
        <div className="perm-editor">
            {/* Preset buttons */}
            <div className="perm-presets">
                <button type="button" className="perm-preset-btn all" onClick={() => applyPreset('all')}>
                    🔓 ให้ทุกสิทธิ์
                </button>
                <button type="button" className="perm-preset-btn view" onClick={() => applyPreset('viewOnly')}>
                    👁 ดูอย่างเดียว
                </button>
                <button type="button" className="perm-preset-btn none" onClick={() => applyPreset('none')}>
                    🚫 ล้างทั้งหมด
                </button>
            </div>

            {/* Two-column layout */}
            <div className="perm-columns">
                {[leftGroups, rightGroups].map((groups, colIdx) => (
                    <div key={colIdx} className="perm-column">
                        {groups.map(group => (
                            <div key={group.id} className="perm-group">
                                <div className="perm-group-header">{group.label}</div>
                                <div className="perm-group-body">
                                    {group.pages.map(page => {
                                        const pageActions = permissions[page.id] || [];
                                        const isPageActive = pageActions.length > 0;

                                        return (
                                            <div key={page.id} className={`perm-page ${isPageActive ? 'active' : ''}`}>
                                                <div className="perm-page-row">
                                                    <label className="perm-page-name" onClick={() => togglePage(page.id, page.actions)}>
                                                        <span className="perm-page-icon">{page.icon}</span>
                                                        {page.label}
                                                    </label>
                                                    <div className="perm-actions">
                                                        {page.actions.map(action => (
                                                            <label key={action} className={`perm-action-chip ${isChecked(page.id, action) ? 'checked' : ''}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked(page.id, action)}
                                                                    onChange={() => toggleAction(page.id, action)}
                                                                />
                                                                {ACTION_LABELS[action]}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
