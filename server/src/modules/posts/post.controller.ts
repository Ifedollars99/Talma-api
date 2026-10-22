import type { Request, Response } from 'express'
import * as postService from './post.service.js'
import type { CreatePostInput, FeedQuery } from './post.validation.js'

/** GET /api/posts */
export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as FeedQuery
  const result = await postService.listPosts(query, req.userId)
  res.json(result)
}

/** POST /api/posts */
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreatePostInput
  const post = await postService.createPost(req.userId as string, body)
  res.status(201).json({ post })
}

/** POST /api/posts/:id/like */
export async function like(req: Request, res: Response): Promise<void> {
  const post = await postService.likePost(req.params.id as string, req.userId as string)
  res.json({ post })
}

/** DELETE /api/posts/:id/like */
export async function unlike(req: Request, res: Response): Promise<void> {
  const post = await postService.unlikePost(req.params.id as string, req.userId as string)
  res.json({ post })
}

/** DELETE /api/posts/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  await postService.deletePost(
    req.params.id as string,
    req.userId as string,
    req.auth?.role ?? 'student',
  )
  res.status(204).send()
}
