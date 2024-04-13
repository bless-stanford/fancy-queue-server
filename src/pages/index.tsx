// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// config
import { HOST_API } from '../config-global';

// ----------------------------------------------------------------------

type BlockProps = {
  path: React.ReactNode;
  method: string;
  description?: string;
};

export default function IndexPage() {
  const renderHead = (
    <Stack spacing={2} sx={{ textAlign: 'center' }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 'fontWeightBold' }}>
        Main server for fancy queue
      </Typography>

      <Typography variant="body2">
        Host API: <strong>{HOST_API}</strong>
      </Typography>
    </Stack>
  );

  const renderNewUser = (
    <Stack spacing={1}>
      <Typography variant="h6" sx={{ fontWeight: 'fontWeightBold' }}>
        New User
      </Typography>
      <Block method="POST" description="Register" path="/api/register-new-user" />
    </Stack>
  );

  return (
    <Container
      maxWidth="md"
      sx={{
        p: 5,
        my: 5,
        borderRadius: 2,
        bgcolor: '#F4F6F8',
        minHeight: '100vh',
        fontFamily: 'fontFamily',
      }}
    >
      <Stack spacing={3}>
        {renderHead}

        <Divider sx={{ borderStyle: 'dashed' }} />

        {renderNewUser}
      </Stack>
    </Container>
  );
}

// ----------------------------------------------------------------------

function Block({ method, path, description }: BlockProps) {
  const renderDescription = (
    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
      {description}
    </Typography>
  );

  const renderMethod = (
    <Box
      component="span"
      sx={{
        mr: 1,
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        typography: 'caption',
        color: 'common.white',

        fontWeight: 'fontWeightBold',
        ...(method === 'GET' && {
          bgcolor: 'success.light',
        }),
        ...(method === 'POST' && {
          bgcolor: 'info.light',
        }),
        ...(method === 'PUT' && {
          bgcolor: 'warning.light',
        }),
        ...(method === 'PATCH' && {
          bgcolor: 'error.light',
        }),
      }}
    >
      {method}
    </Box>
  );

  const renderPath = (
    <Box component="span" sx={{ flexGrow: 1 }}>
      {path}
    </Box>
  );

  return (
    <Stack
      component={Paper}
      spacing={1}
      elevation={0}
      sx={{
        p: 1.5,
        '& strong': {
          color: 'error.main',
        },
      }}
    >
      {description && renderDescription}
      <Stack direction="row" alignItems="center">
        {renderMethod}

        {renderPath}
      </Stack>
    </Stack>
  );
}
