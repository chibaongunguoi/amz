/**
 * Posts Service - Quản lý bài viết
 */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postsService } from './firestore.service';
import {
  setPosts,
  addPost as addPostAction,
  updatePost as updatePostAction,
  deletePost as deletePostAction,
  setEditingPost,
  clearEditingPost,
  selectPosts,
  selectEditingPost,
} from '../store/slices/postsSlice';

const CACHE_KEY = 'posts_last_fetched';
const CACHE_DURATION = 30 * 1000; 


export const usePosts = () => {
  const dispatch = useDispatch();
  const posts = useSelector(selectPosts);
  const editingPost = useSelector(selectEditingPost);


  const isCacheValid = useCallback(() => {
    const lastFetched = localStorage.getItem(CACHE_KEY);
    if (!lastFetched) return false;
    return Date.now() - parseInt(lastFetched, 10) < CACHE_DURATION;
  }, []);


  const updateCacheTimestamp = useCallback(() => {
    localStorage.setItem(CACHE_KEY, Date.now().toString());
  }, []);


  const fetchPosts = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && posts.length > 0 && isCacheValid()) {
      return posts;
    }

    const allPosts = await postsService.getAll();
    dispatch(setPosts(allPosts));
    updateCacheTimestamp();
    return allPosts;
  }, [dispatch, posts, isCacheValid, updateCacheTimestamp]);


  const getPostById = useCallback(async (id) => {
    const cached = posts.find(p => p.id === id);
    if (cached) return cached;

    return await postsService.getById(id);
  }, [posts]);


  const addPost = useCallback(async (data) => {
    const id = await postsService.add(data);
    dispatch(addPostAction({ id, ...data }));
    return id;
  }, [dispatch]);


  const updatePost = useCallback(async (id, data) => {
    await postsService.update(id, data);
    dispatch(updatePostAction({ id, data }));
  }, [dispatch]);

 
  const deletePost = useCallback(async (id) => {
    await postsService.delete(id);
    dispatch(deletePostAction(id));
  }, [dispatch]);


  const startEditing = useCallback((post) => {
    dispatch(setEditingPost(post));
  }, [dispatch]);


  const stopEditing = useCallback(() => {
    dispatch(clearEditingPost());
  }, [dispatch]);

  return {
    posts,
    editingPost,

    fetchPosts,
    getPostsWithStore: fetchPosts, 
    getPostById,

    addPost,
    updatePost,
    deletePost,

    startEditing,
    stopEditing,
  };
};

export const usePostService = usePosts;

export default usePosts;
