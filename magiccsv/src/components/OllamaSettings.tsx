// src/components/OllamaSettings.tsx

import React, { useState, useEffect } from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Slider, Typography, Accordion, AccordionSummary, AccordionDetails, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


interface OllamaSettingsProps {
  onSettingsChange: (settings: any) => void;
}

const OllamaSettings: React.FC<OllamaSettingsProps> = ({ onSettingsChange }) => {
  // State variables for settings
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [seed, setSeed] = useState<number>(42);
  const [numCtx, setNumCtx] = useState<number>(8192);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch available models from the Ollama API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${ollamaUrl}/api/tags`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const models = data.models.map((model: any) => model.name);
        setModels(models);
        if (models.length > 0) {
          setSelectedModel(models[0]);
        }
        setErrorMessage('');
      } catch (error) {
        console.error('Error fetching models:', error);
        setErrorMessage('Failed to fetch models. Please check the Ollama Server URL.');
      }
    };

    fetchModels();
  }, [ollamaUrl]);

  // Notify parent component of settings change
  useEffect(() => {
    onSettingsChange({
      ollamaUrl,
      selectedModel,
      temperature,
      topP,
      seed,
      numCtx,
      systemPrompt,
    });
  }, [ollamaUrl, selectedModel, temperature, topP, seed, numCtx, systemPrompt, onSettingsChange]);

  // Input validation
  const handleTemperatureChange = (value: number) => {
    if (value >= 0 && value <= 2) {
      setTemperature(value);
    }
  };

  const handleTopPChange = (value: number) => {
    if (value >= 0 && value <= 1) {
      setTopP(value);
    }
  };

  const handleSeedChange = (value: number) => {
    if (!isNaN(value)) {
      setSeed(value);
    }
  };

  const handleNumCtxChange = (value: number) => {
    if (!isNaN(value) && value > 0) {
      setNumCtx(value);
    }
  };

  return (
    <div style={{ width: 300 }}>
      <Typography variant="h6" style={{ padding: '16px' }}>
        Settings
      </Typography>

      {errorMessage && (
        <Alert severity="error" style={{ margin: '0 16px' }}>
          {errorMessage}
        </Alert>
      )}

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="model-settings-content" id="model-settings-header">
          <Typography>🛠️ Model Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth margin="normal">
            <TextField label="Ollama Server URL" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} />
          </FormControl>
          <FormControl fullWidth margin="normal" disabled={models.length === 0}>
            <InputLabel id="model-select-label">Select Model</InputLabel>
            <Select labelId="model-select-label" id="model-select" value={selectedModel} label="Select Model" onChange={(e) => setSelectedModel(e.target.value)}>
              {models.map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography gutterBottom>Temperature</Typography>
          <Slider value={temperature} onChange={(e, value) => handleTemperatureChange(value as number)} step={0.1} min={0} max={2} valueLabelDisplay="auto" />
          <Typography gutterBottom>Top P</Typography>
          <Slider value={topP} onChange={(e, value) => handleTopPChange(value as number)} step={0.05} min={0} max={1} valueLabelDisplay="auto" />
          <FormControl fullWidth margin="normal">
            <TextField label="Seed" type="number" value={seed} onChange={(e) => handleSeedChange(parseInt(e.target.value, 10))} />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField label="Num Ctx" type="number" value={numCtx} onChange={(e) => handleNumCtxChange(parseInt(e.target.value, 10))} />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField label="System Prompt" multiline rows={2} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
          </FormControl>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default OllamaSettings;