'use client';

import { type CatalogRenderers, createCatalog } from '@copilotkit/a2ui-renderer';
import { type Definitions, definitions } from './definitions';

const myRenderers: CatalogRenderers<Definitions> = {
  StatusBadge: ({ props }) => {
    const colors = {
      success: { bg: '#dcfce7', text: '#166534' },
      warning: { bg: '#fef3c7', text: '#92400e' },
      error: { bg: '#fee2e2', text: '#991b1b' },
    };
    const c = colors[props.variant ?? 'success'];
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: '0.75rem',
          background: c.bg,
          color: c.text,
        }}
      >
        {props.text}
      </span>
    );
  },

  Metric: ({ props }) => (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{props.label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
        {props.value} {props.trend === 'up' ? '↑' : props.trend === 'down' ? '↓' : ''}
      </div>
    </div>
  ),
};

export const a2uiCatalog = createCatalog(definitions, myRenderers, {
  catalogId: 'app-catalog',
  includeBasicCatalog: true, // merges with built-in components
});
