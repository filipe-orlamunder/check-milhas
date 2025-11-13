import { vi } from 'vitest';
export function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

export function getRouteHandler(router: any, method: string, path: string) {
  const layer = router.stack.find((l: any) => l?.route && l.route.path === path && l.route.methods[method]);
  if (!layer) throw new Error(`Route not found: [${method.toUpperCase()}] ${path}`);
  const stack = layer.route.stack;
  // retorna o último handler (ignora middlewares como auth)
  return stack[stack.length - 1].handle;
}
