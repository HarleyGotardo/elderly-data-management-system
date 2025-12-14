// BIR AlphaList-inspired theme styles
export const theme = {
  colors: {
    primary: '#0056b3',
    primaryLight: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    
    // BIR-inspired colors
    birBlue: '#1e3a8a',
    birLightBlue: '#3b82f6',
    birBackground: '#e8f4fc',
    birBackgroundGradient: 'linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%)',
    birPanelBackground: '#ffffff',
    birBorder: '#dee2e6',
    birText: '#212529',
    birTextSecondary: '#6c757d',
    birButtonBlue: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
    birButtonRed: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
  
  shadows: {
    panel: '0 2px 4px rgba(0,0,0,0.1)',
    button: '0 2px 4px rgba(0,0,0,0.2)',
    inset: 'inset 0 1px 3px rgba(0,0,0,0.1)',
  },
  
  fonts: {
    primary: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    monospace: '"Courier New", Courier, monospace',
  },
  
  components: {
    panel: {
      background: theme.colors.birPanelBackground,
      border: `1px solid ${theme.colors.birBorder}`,
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.lg,
    },
    
    button: {
      primary: {
        background: theme.colors.birButtonBlue,
        color: '#ffffff',
        border: '1px solid #2c5aa0',
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontWeight: '600',
        boxShadow: theme.shadows.button,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'linear-gradient(135deg, #357abd 0%, #2968a3 100%)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: theme.shadows.inset,
        },
      },
      
      secondary: {
        background: '#f8f9fa',
        color: theme.colors.birText,
        border: `1px solid ${theme.colors.birBorder}`,
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontWeight: '600',
        boxShadow: theme.shadows.panel,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: '#e9ecef',
          borderColor: '#adb5bd',
        },
      },
      
      danger: {
        background: theme.colors.birButtonRed,
        color: '#ffffff',
        border: '1px solid #a93226',
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontWeight: '600',
        boxShadow: theme.shadows.button,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        },
      },
    },
    
    input: {
      background: '#ffffff',
      border: `1px solid ${theme.colors.birBorder}`,
      borderRadius: theme.borderRadius.sm,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: '14px',
      fontFamily: theme.fonts.primary,
      '&:focus': {
        outline: 'none',
        borderColor: theme.colors.birLightBlue,
        boxShadow: `0 0 0 2px rgba(59, 130, 246, 0.2)`,
      },
    },
    
    table: {
      background: '#ffffff',
      border: `1px solid ${theme.colors.birBorder}`,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      boxShadow: theme.shadows.panel,
    },
  },
};

export default theme;
