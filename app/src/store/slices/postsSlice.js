import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  editingPost: null,
  loading: false,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => { state.items = action.payload; },
    addPost: (state, action) => { state.items.unshift(action.payload); },
    updatePost: (state, action) => {
      const { id, data } = action.payload;
      const index = state.items.findIndex(post => post.id === id);
      if (index !== -1) state.items[index] = { ...state.items[index], ...data };
    },
    deletePost: (state, action) => { state.items = state.items.filter(post => post.id !== action.payload); },
    clearPosts: (state) => { state.items = []; },
    setEditingPost: (state, action) => { state.editingPost = action.payload; },
    updateEditingPost: (state, action) => {
      if (state.editingPost) state.editingPost = { ...state.editingPost, ...action.payload };
    },
    clearEditingPost: (state) => { state.editingPost = null; },
    setLoading: (state, action) => { state.loading = action.payload; },
    resetPosts: () => initialState,
  },
});

export const selectPosts = (state) => state.posts.items;
export const selectEditingPost = (state) => state.posts.editingPost;
export const selectPostsLoading = (state) => state.posts.loading;
export const selectPostById = (id) => (state) => state.posts.items.find(post => post.id === id);

export const {
  setPosts, addPost, updatePost, deletePost, clearPosts,
  setEditingPost, updateEditingPost, clearEditingPost, setLoading, resetPosts,
} = postsSlice.actions;

export default postsSlice.reducer;
