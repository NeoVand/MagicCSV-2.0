// src/theme.ts

import { createTheme } from '@mui/material/styles';

const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#ffc400' : '#b88d00',
      },
      secondary: {
        main: mode === 'light' ? '#ffc400' : '#b88d00',
      },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? 'transparent' : '#121212 !important',
                boxShadow: 'none',
                '& .MuiToolbar-root': {
                    paddingLeft: '50px',
                    paddingRight: '37px',
                    maxWidth: '100%',
                    width: '100%',
                    backgroundColor: mode === 'light' ? 'transparent' : '#121212 !important',
                  },    
                '& .MuiIconButton-root': {
                  color: mode === 'light' ? 'inherit' : '#b88d00'
                },
                '& .MuiButton-root': {
                  color: mode === 'light' ? 'inherit' : '#b88d00'
                }
              },
            },
          },
        MuiButtonBase: {
            styleOverrides: {
              root: {
                '&:focus': {
                    outline: 'none',
                  },
                '&:focus-visible': {
                  outline: 'none',
                  boxShadow: 'none',
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
                root: {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffc400',
                    borderWidth: '2px',
                  },
                },
              },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .mentions__control': {
                  backgroundColor: mode === 'dark' ? '#121212' : 'transparent',
                  transition: 'border-color 0.2s ease',
                  '&:hover': {
                    borderColor: mode === 'dark' ? '#ffffff40' : '#00000040',
                  },
                  '&:focus-within': {
                    borderColor: '#ffc400',
                    borderWidth: '2px',
                  }
                },
                '& .mentions__input': {
                  '& textarea': {
                    '&:focus': {
                      outline: 'none !important',
                      outlineOffset: '0px !important',
                    }
                  }
                },
                '& .mentions__suggestions': {
                  marginTop: '8px',
                  '& > div': {
                    backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                  }
                }
              },
            },
          },
        },
    shape: {
      borderRadius: 8, // More rounded corners
    },
  });

export default getTheme;