import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  brands: [],
  homeConfig: {},
  homeSettings: [],
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setBrands: (state, action) => {
      state.brands = action.payload;
    },
    setHomeConfig: (state, action) => {
      state.homeConfig = action.payload;
    },
    updateHomeConfig: (state, action) => {
      state.homeConfig = { ...state.homeConfig, ...action.payload };
    },
    setHomeSettings: (state, action) => {
      state.homeSettings = action.payload;
    },
    addHomeSetting: (state, action) => {
      state.homeSettings.push(action.payload);
    },
    updateHomeSetting: (state, action) => {
      const { id, data } = action.payload;
      const index = state.homeSettings.findIndex(item => item.id === id);
      if (index !== -1) {
        state.homeSettings[index] = { ...state.homeSettings[index], ...data };
      }
    },
    deleteHomeSetting: (state, action) => {
      state.homeSettings = state.homeSettings.filter(item => item.id !== action.payload);
    },
    resetSettings: () => initialState,
  },
});

export const selectBrands = (state) => state.settings.brands;
export const selectHomeConfig = (state) => state.settings.homeConfig;
export const selectHomeSettings = (state) => state.settings.homeSettings;
export const selectHomeSettingById = (id) => (state) => 
  state.settings.homeSettings.find(item => item.id === id);

export const {
  setBrands,
  setHomeConfig,
  updateHomeConfig,
  setHomeSettings,
  addHomeSetting,
  updateHomeSetting,
  deleteHomeSetting,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
