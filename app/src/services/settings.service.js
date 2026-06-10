import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { homeSettingsService, brandsService } from './firestore.service';
import {
  setBrands,
  setHomeSettings,
  addHomeSetting as addHomeSettingAction,
  updateHomeSetting as updateHomeSettingAction,
  deleteHomeSetting as deleteHomeSettingAction,
  selectBrands,
  selectHomeSettings,
} from '../store/slices/settingsSlice';

const CACHE_KEY = 'settings_last_fetched';
const CACHE_DURATION = 30 * 1000;

export const useSettings = () => {
  const dispatch = useDispatch();
  const brands = useSelector(selectBrands);
  const homeSettings = useSelector(selectHomeSettings);

  const isCacheValid = useCallback(() => {
    const lastFetched = localStorage.getItem(CACHE_KEY);
    if (!lastFetched) return false;
    return Date.now() - parseInt(lastFetched, 10) < CACHE_DURATION;
  }, []);

  const updateCacheTimestamp = useCallback(() => {
    localStorage.setItem(CACHE_KEY, Date.now().toString());
  }, []);

  const fetchBrands = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && brands.length > 0 && isCacheValid()) {
      return brands;
    }
    const allBrands = await brandsService.getAll();
    dispatch(setBrands(allBrands));
    updateCacheTimestamp();
    return allBrands;
  }, [dispatch, brands, isCacheValid, updateCacheTimestamp]);

  const fetchHomeSettings = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && homeSettings.length > 0 && isCacheValid()) {
      return homeSettings;
    }
    const allSettings = await homeSettingsService.getAll();
    dispatch(setHomeSettings(allSettings));
    updateCacheTimestamp();
    return allSettings;
  }, [dispatch, homeSettings, isCacheValid, updateCacheTimestamp]);

  const getHomeSettingById = useCallback(async (id) => {
    const cached = homeSettings.find(s => s.id === id);
    if (cached) return cached;
    return await homeSettingsService.getById(id);
  }, [homeSettings]);

  const addHomeSetting = useCallback(async (data) => {
    const id = await homeSettingsService.add(data);
    dispatch(addHomeSettingAction({ id, ...data }));
    return id;
  }, [dispatch]);

  const updateHomeSetting = useCallback(async (id, data) => {
    await homeSettingsService.update(id, data);
    dispatch(updateHomeSettingAction({ id, data }));
  }, [dispatch]);

  const deleteHomeSetting = useCallback(async (id) => {
    await homeSettingsService.delete(id);
    dispatch(deleteHomeSettingAction(id));
  }, [dispatch]);

  return {
    brands,
    homeSettings,
    fetchBrands,
    fetchHomeSettings,
    getHomeSettingsWithStore: fetchHomeSettings,
    getHomeSettingById,
    addHomeSetting,
    updateHomeSetting,
    deleteHomeSetting,
  };
};

export const useHomeSettingService = useSettings;
export default useSettings;
