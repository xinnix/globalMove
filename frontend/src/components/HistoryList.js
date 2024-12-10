import React from 'react';
import { List, ListItem, ListItemText, Typography, Paper, IconButton } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

const HistoryList = ({ history, onPlayRecording }) => {
  return (
    <Paper elevation={3} sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
      <List>
        {history.map((item, index) => (
          <ListItem
            key={index}
            divider={index < history.length - 1}
            secondaryAction={
              item.recordingUrl && (
                <IconButton edge="end" onClick={() => onPlayRecording(item.recordingUrl)}>
                  <PlayArrow />
                </IconButton>
              )
            }
          >
            <ListItemText
              primary={
                <Typography variant="body1" component="div">
                  <strong>English:</strong> {item.english}
                </Typography>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Chinese:</strong> {item.chinese}
                  </Typography>
                  {item.score && (
                    <Typography variant="body2" color="primary">
                      Score: {item.score}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default HistoryList;
