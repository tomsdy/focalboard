package integrationtests

import (
	"fmt"
	"testing"

	"github.com/mattermost/focalboard/server/client"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestSubscriptions(client *client.Client, num int, workspaceID string) ([]*model.Subscription, string, error) {
	newSubs := make([]*model.Subscription, 0, num)

	user, resp := client.GetMe()
	if resp.Error != nil {
		return nil, "", fmt.Errorf("cannot get current user: %w", resp.Error)
	}

	for n := 0; n < num; n++ {
		sub := &model.Subscription{
			BlockType:      model.TypeCard,
			BlockID:        utils.NewID(utils.IDTypeCard),
			WorkspaceID:    workspaceID,
			SubscriberType: model.SubTypeUser,
			SubscriberID:   user.ID,
		}

		subNew, resp := client.CreateSubscription(workspaceID, sub)
		if resp.Error != nil {
			return nil, "", resp.Error
		}
		newSubs = append(newSubs, subNew)
	}
	return newSubs, user.ID, nil
}

func TestCreateSubscription(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	container := store.Container{
		WorkspaceID: utils.NewID(utils.IDTypeWorkspace),
	}

	t.Run("Create valid subscription", func(t *testing.T) {
		subs, userID, err := createTestSubscriptions(th.Client, 5, container.WorkspaceID)
		require.NoError(t, err)
		require.Len(t, subs, 5)

		// fetch the newly created subscriptions and compare
		subsFound, resp := th.Client.GetSubscriptions(container.WorkspaceID, userID)
		require.NoError(t, resp.Error)
		require.Len(t, subsFound, 5)
		assert.ElementsMatch(t, subs, subsFound)
	})

	t.Run("Create invalid subscription", func(t *testing.T) {
		user, resp := th.Client.GetMe()
		require.NoError(t, resp.Error)

		sub := &model.Subscription{
			WorkspaceID:  container.WorkspaceID,
			SubscriberID: user.ID,
		}
		_, resp = th.Client.CreateSubscription(container.WorkspaceID, sub)
		require.Error(t, resp.Error)
	})

	t.Run("Create subscription for another user", func(t *testing.T) {
		sub := &model.Subscription{
			WorkspaceID:  container.WorkspaceID,
			SubscriberID: utils.NewID(utils.IDTypeUser),
		}
		_, resp := th.Client.CreateSubscription(container.WorkspaceID, sub)
		require.Error(t, resp.Error)
	})
}

func TestGetSubscriptions(t *testing.T) {
	th := SetupTestHelperWithoutToken().InitBasic()
	defer th.TearDown()

	err := th.InitUsers("user1", "user2")
	require.NoError(t, err, "failed to init users")

	container := store.Container{
		WorkspaceID: utils.NewID(utils.IDTypeWorkspace),
	}

	t.Run("Get subscriptions for user", func(t *testing.T) {
		mySubs, user1ID, err := createTestSubscriptions(th.Client, 5, container.WorkspaceID)
		require.NoError(t, err)
		require.Len(t, mySubs, 5)

		// create more subscriptions with different user
		otherSubs, _, err := createTestSubscriptions(th.Client2, 10, container.WorkspaceID)
		require.NoError(t, err)
		require.Len(t, otherSubs, 10)

		// fetch the newly created subscriptions for current user, making sure only
		// the ones created for the current user are returned.
		subsFound, resp := th.Client.GetSubscriptions(container.WorkspaceID, user1ID)
		require.NoError(t, resp.Error)
		require.Len(t, subsFound, 5)
		assert.ElementsMatch(t, mySubs, subsFound)
	})
}

func TestDeleteSubscription(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	container := store.Container{
		WorkspaceID: utils.NewID(utils.IDTypeWorkspace),
	}

	t.Run("Delete valid subscription", func(t *testing.T) {
		subs, userID, err := createTestSubscriptions(th.Client, 3, container.WorkspaceID)
		require.NoError(t, err)
		require.Len(t, subs, 3)

		resp := th.Client.DeleteSubscription(container.WorkspaceID, subs[1].BlockID, userID)
		require.NoError(t, resp.Error)

		// fetch the subscriptions and ensure the list is correct
		subsFound, resp := th.Client.GetSubscriptions(container.WorkspaceID, userID)
		require.NoError(t, resp.Error)
		require.Len(t, subsFound, 2)

		assert.Contains(t, subsFound, subs[0])
		assert.Contains(t, subsFound, subs[2])
		assert.NotContains(t, subsFound, subs[1])
	})

	t.Run("Delete invalid subscription", func(t *testing.T) {
		user, resp := th.Client.GetMe()
		require.NoError(t, resp.Error)

		resp = th.Client.DeleteSubscription(container.WorkspaceID, "bogus", user.ID)
		require.Error(t, resp.Error)
	})
}
