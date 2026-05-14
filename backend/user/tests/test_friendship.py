from rest_framework.test import APITestCase
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model

from user.models import Friendship
from user.services.friendship_service import FriendshipService
from user.services.invite_service import InviteService

User = get_user_model()


class SocialTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(email="u1@test.com", password="12345678")
        self.user2 = User.objects.create_user(email="u2@test.com", password="12345678")
        self.user3 = User.objects.create_user(email="u3@test.com", password="12345678")

    def test_send_friend_request(self):
        friendship = FriendshipService.send_request(self.user1, self.user2)

        self.assertEqual(friendship.sender, self.user1)
        self.assertEqual(friendship.receiver, self.user2)
        self.assertEqual(friendship.status, "pending")

    def test_cannot_add_self(self):
        with self.assertRaises(ValidationError):
            FriendshipService.send_request(self.user1, self.user1)

    def test_accept_request(self):
        friendship = FriendshipService.send_request(self.user1, self.user2)

        FriendshipService.accept_request(friendship, self.user2)

        friendship.refresh_from_db()
        self.assertEqual(friendship.status, "accepted")

    def test_decline_request(self):
        friendship = FriendshipService.send_request(self.user1, self.user2)

        FriendshipService.decline_request(friendship, self.user2)

        friendship.refresh_from_db()
        self.assertEqual(friendship.status, "rejected")

    def test_delete_friendship(self):
        friendship = FriendshipService.send_request(self.user1, self.user2)
        FriendshipService.accept_request(friendship, self.user2)

        FriendshipService.delete_friendship(friendship, self.user1)

        self.assertFalse(Friendship.objects.filter(id=friendship.id).exists())

    def test_mutual_friends(self):
        f1 = FriendshipService.send_request(self.user1, self.user3)
        FriendshipService.accept_request(f1, self.user3)

        f2 = FriendshipService.send_request(self.user2, self.user3)
        FriendshipService.accept_request(f2, self.user3)

        mutual = FriendshipService.get_mutual_friends(self.user1, self.user2)

        self.assertIn(self.user3, mutual)

    def test_create_invite(self):
        invite = InviteService.create_invite(self.user1)

        self.assertEqual(invite.inviter, self.user1)
        self.assertIsNotNone(invite.token)

    def test_use_invite(self):
        invite = InviteService.create_invite(self.user1)

        InviteService.use_invite(invite.token, self.user2)

        invite.refresh_from_db()

        self.assertTrue(invite.is_used)
        self.assertTrue(
            Friendship.objects.filter(
                sender=self.user2,
                receiver=self.user1
            ).exists()
        )

    def test_invalid_invite(self):
        with self.assertRaises(ValidationError):
            InviteService.use_invite("ac462f1431084fb29c8133b683bb558a", self.user2)

    def test_used_invite(self):
        invite = InviteService.create_invite(self.user1)

        InviteService.use_invite(invite.token, self.user2)

        with self.assertRaises(ValidationError):
            InviteService.use_invite(invite.token, self.user2)

    def test_create_invite_api(self):
        self.client.force_authenticate(self.user1)

        response = self.client.post("/api/user/invite/")

        self.assertEqual(response.status_code, 201)
        self.assertIn("link", response.data)

    def test_send_friend_request_api(self):
        self.client.force_authenticate(self.user1)

        response = self.client.post("/api/user/friendship/send/", {
            "receiver_id": self.user2.id
        })

        self.assertEqual(response.status_code, 201)
