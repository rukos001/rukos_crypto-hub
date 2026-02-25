import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Heart, Trash2, Clock, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PostsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки постов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = newPost.tags.split(',').map(t => t.trim()).filter(Boolean);
      await axios.post(`${API}/posts`, {
        title: newPost.title,
        content: newPost.content,
        tags: tagsArray
      });
      toast.success('Пост создан!');
      setNewPost({ title: '', content: '', tags: '' });
      setIsOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error('Ошибка создания поста');
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API}/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API}/posts/${postId}`);
      toast.success('Пост удален');
      fetchPosts();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="posts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Посты</h1>
          <p className="text-muted-foreground">Обзоры рынка и новости от сообщества</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-semibold" data-testid="create-post-btn">
              <Plus className="w-4 h-4 mr-2" /> Новый пост
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle>Создать пост</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Input
                placeholder="Заголовок"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="bg-secondary/50 border-white/10"
                data-testid="post-title-input"
                required
              />
              <Textarea
                placeholder="Содержание поста..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="bg-secondary/50 border-white/10 min-h-[150px]"
                data-testid="post-content-input"
                required
              />
              <Input
                placeholder="Теги (через запятую)"
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                className="bg-secondary/50 border-white/10"
                data-testid="post-tags-input"
              />
              <Button type="submit" className="w-full bg-[#F7931A] hover:bg-[#FFAC40] text-black font-semibold" data-testid="submit-post-btn">
                Опубликовать
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-secondary/50 rounded w-1/3 mb-4" />
                <div className="h-4 bg-secondary/50 rounded w-full mb-2" />
                <div className="h-4 bg-secondary/50 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Пока нет постов. Будьте первым!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="glass-card hover:-translate-y-1 transition-all duration-300" data-testid={`post-${post.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" /> {post.author_username}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>
                  {user?.id === post.author_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      className="text-muted-foreground hover:text-[#EF4444]"
                      data-testid={`delete-post-${post.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap mb-4">{post.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-white/10 text-muted-foreground">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className="text-muted-foreground hover:text-[#EF4444]"
                    data-testid={`like-post-${post.id}`}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="font-mono">{post.likes}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
