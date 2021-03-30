package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func StoreTestSharingStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("UpsertSharingAndGetSharing", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpsertSharingAndGetSharing(t, store, container)
	})
}

func testUpsertSharingAndGetSharing(t *testing.T, store store.Store, container store.Container) {
	t.Run("Insert first sharing and get it", func(t *testing.T) {
		sharing := model.Sharing{
			ID:         "sharing-id",
			Enabled:    true,
			Token:      "token",
			ModifiedBy: "user-id",
		}

		err := store.UpsertSharing(container, sharing)
		require.NoError(t, err)
		newSharing, err := store.GetSharing(container, "sharing-id")
		require.NoError(t, err)
		newSharing.UpdateAt = 0
		require.Equal(t, sharing, *newSharing)
	})
	t.Run("Upsert the inserted sharing and get it", func(t *testing.T) {
		sharing := model.Sharing{
			ID:         "sharing-id",
			Enabled:    true,
			Token:      "token2",
			ModifiedBy: "user-id2",
		}

		newSharing, err := store.GetSharing(container, "sharing-id")
		require.NoError(t, err)
		newSharing.UpdateAt = 0
		require.NotEqual(t, sharing, *newSharing)

		err = store.UpsertSharing(container, sharing)
		require.NoError(t, err)
		newSharing, err = store.GetSharing(container, "sharing-id")
		require.NoError(t, err)
		newSharing.UpdateAt = 0
		require.Equal(t, sharing, *newSharing)
	})
	t.Run("Get not existing sharing", func(t *testing.T) {
		_, err := store.GetSharing(container, "not-existing")
		require.Error(t, err)
	})
}
