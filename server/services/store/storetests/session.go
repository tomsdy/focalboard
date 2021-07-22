package storetests

import (
	"fmt"
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func StoreTestSessionStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("CreateAndGetAndDeleteSession", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndGetAndDeleteSession(t, store, container)
	})

	t.Run("GetActiveUserCount", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetActiveUserCount(t, store, container)
	})

	t.Run("UpdateSession", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpdateSession(t, store, container)
	})
}

func testCreateAndGetAndDeleteSession(t *testing.T, store store.Store, _ store.Container) {
	session := &model.Session{
		ID:    "session-id",
		Token: "token",
	}

	t.Run("CreateAndGetSession", func(t *testing.T) {
		err := store.CreateSession(session)
		require.NoError(t, err)

		got, err := store.GetSession(session.Token, 60*60)
		require.NoError(t, err)
		require.Equal(t, session, got)
	})

	t.Run("DeleteAndGetSession", func(t *testing.T) {
		err := store.DeleteSession(session.ID)
		require.NoError(t, err)

		_, err = store.GetSession(session.Token, 60*60)
		require.Error(t, err)
	})
}

func testGetActiveUserCount(t *testing.T, store store.Store, _ store.Container) {
	t.Run("no active user", func(t *testing.T) {
		count, err := store.GetActiveUserCount(60)
		require.NoError(t, err)
		require.Equal(t, 0, count)
	})

	t.Run("active user", func(t *testing.T) {
		// gen random count active user session
		count := int(time.Now().Unix() % 10)
		for i := 0; i < count; i++ {
			session := &model.Session{
				ID:     fmt.Sprintf("id-%d", i),
				UserID: fmt.Sprintf("user-id-%d", i),
				Token:  fmt.Sprintf("token-%d", i),
			}
			err := store.CreateSession(session)
			require.NoError(t, err)
		}

		got, err := store.GetActiveUserCount(60)
		require.NoError(t, err)
		require.Equal(t, count, got)
	})
}

func testUpdateSession(t *testing.T, store store.Store, _ store.Container) {
	session := &model.Session{
		ID:    "session-id",
		Token: "token",
		Props: map[string]interface{}{"field1": "A"},
	}

	err := store.CreateSession(session)
	require.NoError(t, err)

	// update session
	session.Props["field1"] = "B"
	err = store.UpdateSession(session)
	require.NoError(t, err)

	got, err := store.GetSession(session.Token, 60)
	require.NoError(t, err)
	require.Equal(t, session, got)
}
