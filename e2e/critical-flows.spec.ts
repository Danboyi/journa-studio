import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_USER_EMAIL;
const e2ePassword = process.env.E2E_USER_PASSWORD;

test.describe("critical API flows", () => {
  test.skip(!e2eEmail || !e2ePassword, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run.");

  test("auth -> compose -> share -> publish collection", async ({ request }) => {
    const signIn = await request.post("/api/auth/sign-in", {
      data: {
        email: e2eEmail,
        password: e2ePassword,
      },
    });
    expect(signIn.status(), await signIn.text()).toBe(200);
    expect(signIn.headers()["x-request-id"]).toBeTruthy();

    const signInJson = (await signIn.json()) as { user: { id: string } };
    expect(signInJson.user.id).toBeTruthy();

    const session = await request.get("/api/auth/session");
    expect(session.status(), await session.text()).toBe(200);
    expect(session.headers()["x-request-id"]).toBeTruthy();

    const compose = await request.post("/api/copilot/compose", {
      data: {
        mode: "story",
        mood: "suspense",
        stylePreset: "cinematic",
        persist: true,
        sourceText:
          "I missed my train, walked three blocks in the rain, and met an old friend near a bakery where we argued about fear and ambition.",
        voiceNotes:
          "Keep my voice reflective but sharp. Add contrast between uncertainty and hope.",
      },
    });
    expect(compose.status(), await compose.text()).toBe(200);
    expect(compose.headers()["x-request-id"]).toBeTruthy();

    const composeJson = (await compose.json()) as { title: string };
    expect(composeJson.title).toBeTruthy();

    const history = await request.get("/api/copilot/history");
    expect(history.status(), await history.text()).toBe(200);
    expect(history.headers()["x-request-id"]).toBeTruthy();

    const historyJson = (await history.json()) as {
      compositions: Array<{ id: string; title: string }>;
    };
    expect(historyJson.compositions.length).toBeGreaterThan(0);

    const createdComposition = historyJson.compositions.find(
      (item) => item.title === composeJson.title,
    ) ?? historyJson.compositions[0];
    expect(createdComposition.id).toBeTruthy();

    const share = await request.post("/api/copilot/shares", {
      data: {
        compositionId: createdComposition.id,
        expiresInDays: 7,
      },
    });
    expect(share.status(), await share.text()).toBe(201);
    expect(share.headers()["x-request-id"]).toBeTruthy();

    const shareJson = (await share.json()) as { share: { token: string } };
    expect(shareJson.share.token).toBeTruthy();

    const collection = await request.post("/api/collections", {
      data: {
        title: `Playwright Collection ${Date.now()}`,
        description: "Automated e2e collection publish test",
        isPublic: true,
      },
    });
    expect(collection.status(), await collection.text()).toBe(201);
    expect(collection.headers()["x-request-id"]).toBeTruthy();

    const collectionJson = (await collection.json()) as {
      collection: { id: string; slug: string };
    };
    expect(collectionJson.collection.id).toBeTruthy();
    expect(collectionJson.collection.slug).toBeTruthy();

    const addItem = await request.post(
      `/api/collections/${collectionJson.collection.id}/items`,
      {
        data: { compositionId: createdComposition.id },
      },
    );
    expect(addItem.status(), await addItem.text()).toBe(201);
    expect(addItem.headers()["x-request-id"]).toBeTruthy();

    const publicCollection = await request.get(
      `/api/public/collections/${collectionJson.collection.slug}`,
    );
    expect(publicCollection.status(), await publicCollection.text()).toBe(200);
    const publicCollectionJson = (await publicCollection.json()) as {
      collection: { id: string; items: Array<{ composition: { id: string } }> };
    };
    expect(publicCollectionJson.collection.id).toBe(collectionJson.collection.id);
    expect(
      publicCollectionJson.collection.items.some(
        (item) => item.composition.id === createdComposition.id,
      ),
    ).toBeTruthy();

    const publicShare = await request.get(`/api/public/share/${shareJson.share.token}`);
    expect(publicShare.status(), await publicShare.text()).toBe(200);
    expect(publicShare.headers()["x-request-id"]).toBeTruthy();

    const signOut = await request.post("/api/auth/sign-out");
    expect(signOut.status(), await signOut.text()).toBe(200);

    const sessionAfterSignOut = await request.get("/api/auth/session");
    expect(sessionAfterSignOut.status(), await sessionAfterSignOut.text()).toBe(401);
    expect(sessionAfterSignOut.headers()["x-request-id"]).toBeTruthy();
  });
});
