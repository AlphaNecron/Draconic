import {info} from 'lib/logger';
import prisma from 'lib/prisma';
import {VoidRequest, VoidResponse, withVoid} from 'middleware/withVoid';
import {isAdmin} from 'lib/permission';

async function handler(req: VoidRequest, res: VoidResponse) {
  const user = await req.getUser();
  if (!user) return res.unauthorized();
  if (!isAdmin(user.role.permissions)) return res.forbid('Admin permission is required.');
  if (req.method === 'DELETE') {
    if (!req.body.id) return res.forbid('No URL ID');
    const url = await prisma.url.delete({
      where: {
        id: req.body.id
      }
    });
    if (!url) return res.notFound('URL not found');
    info('URL', `User ${user.username} (${user.id}) deleted a url ${url.destination} (${url.id})`);
    return res.json(url);
  } else {
    let urls = await prisma.url.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        createdAt: true,
        short: true,
        destination: true,
        views: true,
        password: true
      },
      orderBy: {
        createdAt: 'asc',
      }
    });
    return res.json(urls.map(url => ({ ...url, password: url.password?.length > 0 })));
  }
}

export default withVoid(handler);
