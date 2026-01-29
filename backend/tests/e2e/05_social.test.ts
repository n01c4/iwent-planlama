/**
 * Social Features E2E Tests
 * Tests: Friendships, Event Likes, Artist Following
 */
import request from 'supertest';
import {
  getApp,
  closeApp,
  getPrisma,
  createTestUser,
  createTestEvent,
  authRequest,
  loginUser,
  getOrganizerToken,
} from './helpers/setup';
import type { FastifyInstance } from 'fastify';

describe('Social Features Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  // =========================================================================
  // FRIENDSHIPS
  // =========================================================================
  describe('Friendships', () => {
    let user1Token: string;
    let user1Id: string;
    let user2Token: string;
    let user2Id: string;

    beforeAll(async () => {
      // Create two users for friendship tests
      const user1 = await createTestUser({
        email: `friend1-${Date.now()}@iwent.test`,
        password: 'Friend1Pass123!',
        name: 'Friend User 1',
      });
      user1Id = user1.user.id;
      const tokens1 = await loginUser(app, {
        email: user1.email,
        password: user1.password,
      });
      user1Token = tokens1.accessToken;

      const user2 = await createTestUser({
        email: `friend2-${Date.now()}@iwent.test`,
        password: 'Friend2Pass123!',
        name: 'Friend User 2',
      });
      user2Id = user2.user.id;
      const tokens2 = await loginUser(app, {
        email: user2.email,
        password: user2.password,
      });
      user2Token = tokens2.accessToken;
    });

    describe('POST /api/v1/users/me/friends/requests', () => {
      it('should send friend request', async () => {
        const response = await authRequest(app, user1Token)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: user2Id })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            status: 'pending',
          },
        });

        // Verify in database
        const prisma = getPrisma();
        const friendship = await prisma.friendship.findFirst({
          where: {
            requesterId: user1Id,
            addresseeId: user2Id,
          },
        });

        expect(friendship).not.toBeNull();
        expect(friendship?.status).toBe('pending');
      });

      it('should not allow duplicate friend request', async () => {
        // Create new users for this test
        const sender = await createTestUser({
          email: `dup-sender-${Date.now()}@iwent.test`,
          password: 'DupSender123!',
        });
        const receiver = await createTestUser({
          email: `dup-receiver-${Date.now()}@iwent.test`,
          password: 'DupReceiver123!',
        });

        const senderTokens = await loginUser(app, {
          email: sender.email,
          password: sender.password,
        });

        // First request
        await authRequest(app, senderTokens.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: receiver.user.id })
          .expect(201);

        // Duplicate request
        await authRequest(app, senderTokens.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: receiver.user.id })
          .expect(409);
      });

      it('should not allow self friend request', async () => {
        await authRequest(app, user1Token)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: user1Id })
          .expect(400);
      });
    });

    describe('GET /api/v1/users/me/friends/requests', () => {
      it('should return received friend requests', async () => {
        const response = await authRequest(app, user2Token)
          .get('/api/v1/users/me/friends/requests?type=received')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });
      });

      it('should return sent friend requests', async () => {
        const response = await authRequest(app, user1Token)
          .get('/api/v1/users/me/friends/requests?type=sent')
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/v1/users/me/friends/requests/:requestId', () => {
      it('should accept friend request', async () => {
        // Create fresh users
        const sender = await createTestUser({
          email: `accept-sender-${Date.now()}@iwent.test`,
          password: 'AcceptSender123!',
        });
        const receiver = await createTestUser({
          email: `accept-receiver-${Date.now()}@iwent.test`,
          password: 'AcceptReceiver123!',
        });

        const senderTokens = await loginUser(app, {
          email: sender.email,
          password: sender.password,
        });
        const receiverTokens = await loginUser(app, {
          email: receiver.email,
          password: receiver.password,
        });

        // Send request
        const requestResponse = await authRequest(app, senderTokens.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: receiver.user.id });

        const requestId = requestResponse.body.data.id;

        // Accept request
        const response = await authRequest(app, receiverTokens.accessToken)
          .post(`/api/v1/users/me/friends/requests/${requestId}`)
          .send({ action: 'accept' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            message: expect.any(String), // API returns { message: 'Friend request accepted' }
          },
        });

        // Verify in database
        const prisma = getPrisma();
        const friendship = await prisma.friendship.findUnique({
          where: { id: requestId },
        });

        expect(friendship?.status).toBe('accepted');
      });

      it('should reject friend request', async () => {
        const sender = await createTestUser({
          email: `reject-sender-${Date.now()}@iwent.test`,
          password: 'RejectSender123!',
        });
        const receiver = await createTestUser({
          email: `reject-receiver-${Date.now()}@iwent.test`,
          password: 'RejectReceiver123!',
        });

        const senderTokens = await loginUser(app, {
          email: sender.email,
          password: sender.password,
        });
        const receiverTokens = await loginUser(app, {
          email: receiver.email,
          password: receiver.password,
        });

        // Send request
        const requestResponse = await authRequest(app, senderTokens.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: receiver.user.id });

        const requestId = requestResponse.body.data.id;

        // Reject request
        const response = await authRequest(app, receiverTokens.accessToken)
          .post(`/api/v1/users/me/friends/requests/${requestId}`)
          .send({ action: 'reject' })
          .expect(200);

        expect(response.body.data.message).toContain('reject'); // API returns { message: 'Friend request rejected' }
      });

      it('should not allow sender to accept own request', async () => {
        const sender = await createTestUser({
          email: `self-accept-${Date.now()}@iwent.test`,
          password: 'SelfAccept123!',
        });
        const receiver = await createTestUser({
          email: `self-accept-recv-${Date.now()}@iwent.test`,
          password: 'SelfAcceptRecv123!',
        });

        const senderTokens = await loginUser(app, {
          email: sender.email,
          password: sender.password,
        });

        // Send request
        const requestResponse = await authRequest(app, senderTokens.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: receiver.user.id });

        const requestId = requestResponse.body.data.id;

        // Sender tries to accept - API returns 404 because it filters by addresseeId
        await authRequest(app, senderTokens.accessToken)
          .post(`/api/v1/users/me/friends/requests/${requestId}`)
          .send({ action: 'accept' })
          .expect(404);
      });
    });

    describe('GET /api/v1/users/me/friends', () => {
      it('should return friends list', async () => {
        const response = await authRequest(app, user1Token)
          .get('/api/v1/users/me/friends')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });
      });
    });

    describe('DELETE /api/v1/users/me/friends/:friendId', () => {
      it('should remove friend', async () => {
        // Create and accept friendship
        const user1 = await createTestUser({
          email: `remove-friend1-${Date.now()}@iwent.test`,
          password: 'RemoveFriend1!',
        });
        const user2 = await createTestUser({
          email: `remove-friend2-${Date.now()}@iwent.test`,
          password: 'RemoveFriend2!',
        });

        const tokens1 = await loginUser(app, {
          email: user1.email,
          password: user1.password,
        });
        const tokens2 = await loginUser(app, {
          email: user2.email,
          password: user2.password,
        });

        // Create and accept friendship
        const requestResponse = await authRequest(app, tokens1.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: user2.user.id });

        const friendshipId = requestResponse.body.data.id;

        await authRequest(app, tokens2.accessToken)
          .post(`/api/v1/users/me/friends/requests/${friendshipId}`)
          .send({ action: 'accept' });

        // Remove friend - API expects friendship ID, not user ID
        await authRequest(app, tokens1.accessToken)
          .delete(`/api/v1/users/me/friends/${friendshipId}`)
          .expect(204); // No Content

        // Verify friendship is removed
        const prisma = getPrisma();
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: user1.user.id, addresseeId: user2.user.id },
              { requesterId: user2.user.id, addresseeId: user1.user.id },
            ],
            status: 'accepted',
          },
        });

        expect(friendship).toBeNull();
      });
    });

    describe('Block User', () => {
      it('should block a user', async () => {
        const blocker = await createTestUser({
          email: `blocker-${Date.now()}@iwent.test`,
          password: 'Blocker123!',
        });
        const blocked = await createTestUser({
          email: `blocked-${Date.now()}@iwent.test`,
          password: 'Blocked123!',
        });

        const blockerTokens = await loginUser(app, {
          email: blocker.email,
          password: blocker.password,
        });

        const response = await authRequest(app, blockerTokens.accessToken)
          .post(`/api/v1/users/me/friends/${blocked.user.id}/block`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify in database
        const prisma = getPrisma();
        const friendship = await prisma.friendship.findFirst({
          where: {
            requesterId: blocker.user.id,
            addresseeId: blocked.user.id,
          },
        });

        expect(friendship?.status).toBe('blocked');
      });

      it('blocked user cannot send friend request', async () => {
        const blocker = await createTestUser({
          email: `block-test1-${Date.now()}@iwent.test`,
          password: 'BlockTest1!',
        });
        const blocked = await createTestUser({
          email: `block-test2-${Date.now()}@iwent.test`,
          password: 'BlockTest2!',
        });

        const blockerTokens = await loginUser(app, {
          email: blocker.email,
          password: blocker.password,
        });
        const blockedTokens = await loginUser(app, {
          email: blocked.email,
          password: blocked.password,
        });

        // Block user
        await authRequest(app, blockerTokens.accessToken)
          .post(`/api/v1/users/me/friends/${blocked.user.id}/block`);

        // Blocked user tries to send friend request
        await authRequest(app, blockedTokens.accessToken)
          .post('/api/v1/users/me/friends/requests')
          .send({ userId: blocker.user.id })
          .expect(403);
      });
    });
  });

  // =========================================================================
  // EVENT LIKES
  // =========================================================================
  describe('Event Likes', () => {
    let userToken: string;
    let userId: string;
    let publishedEventId: string;

    beforeAll(async () => {
      // Create user
      const user = await createTestUser({
        email: `likes-user-${Date.now()}@iwent.test`,
        password: 'LikesUser123!',
      });
      userId = user.user.id;
      const tokens = await loginUser(app, {
        email: user.email,
        password: user.password,
      });
      userToken = tokens.accessToken;

      // Create published event
      const { token, userId: orgUserId } = await getOrganizerToken(app);
      const prisma = getPrisma();
      const organizer = await prisma.organizer.findFirst({
        where: { userId: orgUserId },
      });

      const event = await createTestEvent(organizer!.id, {
        title: 'Event for Likes',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'published',
      });
      publishedEventId = event.id;

      await prisma.event.update({
        where: { id: publishedEventId },
        data: { status: 'published', publishedAt: new Date() },
      });
    });

    describe('POST /api/v1/users/me/likes', () => {
      it('should like an event', async () => {
        const response = await authRequest(app, userToken)
          .post('/api/v1/users/me/likes')
          .send({ eventId: publishedEventId })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            message: expect.any(String), // API returns { message: 'Event liked' }
          },
        });

        // Verify in database
        const prisma = getPrisma();
        const like = await prisma.userLike.findFirst({
          where: {
            userId,
            eventId: publishedEventId,
          },
        });

        expect(like).not.toBeNull();

        // Verify event like count increased
        const event = await prisma.event.findUnique({
          where: { id: publishedEventId },
        });

        expect(event?.likeCount).toBeGreaterThan(0);
      });

      it('should not allow duplicate likes', async () => {
        // Like again (already liked in previous test)
        await authRequest(app, userToken)
          .post('/api/v1/users/me/likes')
          .send({ eventId: publishedEventId })
          .expect(409);
      });
    });

    describe('GET /api/v1/users/me/likes', () => {
      it('should return liked events', async () => {
        const response = await authRequest(app, userToken)
          .get('/api/v1/users/me/likes')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });

        // Should include the liked event - API returns items with id being the event id
        const likedEvent = response.body.data.find(
          (item: any) => item.id === publishedEventId || item.eventId === publishedEventId
        );
        expect(likedEvent).toBeDefined();
      });
    });

    describe('DELETE /api/v1/users/me/likes/:eventId', () => {
      it('should unlike an event', async () => {
        // Create a new like to delete
        const event = await createTestEvent(
          (await getPrisma().organizer.findFirst())!.id,
          {
            title: 'Event to Unlike',
            startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'published',
          }
        );

        await getPrisma().event.update({
          where: { id: event.id },
          data: { status: 'published', publishedAt: new Date() },
        });

        // Like it
        await authRequest(app, userToken)
          .post('/api/v1/users/me/likes')
          .send({ eventId: event.id });

        // Unlike it
        await authRequest(app, userToken)
          .delete(`/api/v1/users/me/likes/${event.id}`)
          .expect(204); // No Content

        // Verify removal
        const prisma = getPrisma();
        const like = await prisma.userLike.findFirst({
          where: {
            userId,
            eventId: event.id,
          },
        });

        expect(like).toBeNull();
      });
    });
  });

  // =========================================================================
  // ARTIST FOLLOWING
  // =========================================================================
  describe('Artist Following', () => {
    let userToken: string;
    let userId: string;
    let artistId: string;

    beforeAll(async () => {
      // Create user
      const user = await createTestUser({
        email: `follow-user-${Date.now()}@iwent.test`,
        password: 'FollowUser123!',
      });
      userId = user.user.id;
      const tokens = await loginUser(app, {
        email: user.email,
        password: user.password,
      });
      userToken = tokens.accessToken;

      // Create artist
      const prisma = getPrisma();
      const artist = await prisma.artist.create({
        data: {
          name: 'Test Artist',
          slug: `test-artist-${Date.now()}`,
          bio: 'A test artist for following tests',
        },
      });
      artistId = artist.id;
    });

    describe('POST /api/v1/artists/:id/follow', () => {
      it('should follow an artist', async () => {
        const response = await authRequest(app, userToken)
          .post(`/api/v1/artists/${artistId}/follow`)
          .expect(200); // API returns 200 with message

        expect(response.body).toMatchObject({
          success: true,
        });

        // Verify in database
        const prisma = getPrisma();
        const follow = await prisma.artistFollower.findFirst({
          where: {
            userId,
            artistId,
          },
        });

        expect(follow).not.toBeNull();

        // Verify follower count
        const artist = await prisma.artist.findUnique({
          where: { id: artistId },
        });

        expect(artist?.followerCount).toBeGreaterThan(0);
      });

      it('should not allow duplicate follows', async () => {
        await authRequest(app, userToken)
          .post(`/api/v1/artists/${artistId}/follow`)
          .expect(409);
      });
    });

    describe('GET /api/v1/users/me/following/artists', () => {
      it('should return followed artists', async () => {
        const response = await authRequest(app, userToken)
          .get('/api/v1/users/me/following/artists')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });

        // Should include the followed artist - API returns items with id being the artist id
        const followedArtist = response.body.data.find(
          (item: any) => item.id === artistId || item.artistId === artistId
        );
        expect(followedArtist).toBeDefined();
      });
    });

    describe('DELETE /api/v1/artists/:id/follow', () => {
      it('should unfollow an artist', async () => {
        // Create a new artist to unfollow
        const prisma = getPrisma();
        const artist = await prisma.artist.create({
          data: {
            name: 'Artist to Unfollow',
            slug: `unfollow-artist-${Date.now()}`,
          },
        });

        // Follow
        await authRequest(app, userToken)
          .post(`/api/v1/artists/${artist.id}/follow`);

        // Unfollow
        await authRequest(app, userToken)
          .delete(`/api/v1/artists/${artist.id}/follow`)
          .expect(204); // No Content

        // Verify removal
        const follow = await prisma.artistFollower.findFirst({
          where: {
            userId,
            artistId: artist.id,
          },
        });

        expect(follow).toBeNull();
      });
    });
  });

  // =========================================================================
  // AUTHENTICATION REQUIREMENTS
  // =========================================================================
  describe('Authentication Requirements', () => {
    it('should require auth for friend requests', async () => {
      await request(app.server)
        .post('/api/v1/users/me/friends/requests')
        .send({ userId: 'some-id' })
        .expect(401);
    });

    it('should require auth for likes', async () => {
      await request(app.server)
        .post('/api/v1/users/me/likes')
        .send({ eventId: 'some-id' })
        .expect(401);
    });

    it('should require auth for artist following', async () => {
      await request(app.server)
        .post('/api/v1/artists/some-id/follow')
        .expect(401);
    });
  });
});
