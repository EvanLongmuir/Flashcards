import { useEffect, useMemo, useState } from "react";
import { fetchJSON, postForm, del } from "./api";

function TagPicker({ tags, selectedTagId, onChange }) {
  return (
    <select value={selectedTagId || ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">(All tags)</option>
      {tags.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

function CreateTag({ onCreated }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/tags/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      onCreated();
    } catch (e2) {
      setErr(String(e2));
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="New tag name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button disabled={!name.trim()}>Add Tag</button>
      {err && <span style={{ color: "crimson" }}>{err}</span>}
    </form>
  );
}

function TagList({ tags, onDelete }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Tags</h3>
      {tags.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No tags yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {tags.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div>{t.name}</div>
              <button onClick={() => onDelete(t)} style={{ color: "crimson" }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCard({ tags, onCreated }) {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [tagIds, setTagIds] = useState([]);
  const [err, setErr] = useState("");

  function toggleTag(id) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const fd = new FormData();
    fd.append("front_text", frontText);
    fd.append("back_text", backText);
    if (frontFile) fd.append("front_image", frontFile);
    if (backFile) fd.append("back_image", backFile);
    // DRF serializer expects tag_ids list; for multipart, send repeated keys or JSON string.
    // Easiest: send as JSON string then parse server-side — but we didn't implement that.
    // So: append each tag id as tag_ids.
    tagIds.forEach((id) => fd.append("tag_ids", id));
    fd.append("tag_ids", tagIds.join(","));


    try {
      await postForm("/cards/", fd);
      setFrontText("");
      setBackText("");
      setFrontFile(null);
      setBackFile(null);
      setTagIds([]);
      onCreated();
    } catch (e2) {
      setErr(String(e2));
    }
  }

  return (
    <form onSubmit={submit} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Create Card</h3>

      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Front text (optional)
          <input value={frontText} onChange={(e) => setFrontText(e.target.value)} />
        </label>

        <label>
          Back text (optional)
          <input value={backText} onChange={(e) => setBackText(e.target.value)} />
        </label>

        <label>
          Front image
          <input type="file" accept="image/*" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
        </label>

        <label>
          Back image
          <input type="file" accept="image/*" onChange={(e) => setBackFile(e.target.files?.[0] || null)} />
        </label>

        <div>
          <div style={{ marginBottom: 6 }}>Tags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((t) => (
              <label key={t.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                />
                {t.name}
              </label>
            ))}
            {tags.length === 0 && <div style={{ opacity: 0.7 }}>Create a tag first</div>}
          </div>
        </div>

        <button>Create</button>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </div>
    </form>
  );
}

function Review({ cards }) {
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    setIdx(0);
    setShowBack(false);
  }, [cards]);

  const current = cards[idx];

  function next() {
    setShowBack(false);
    setIdx((i) => Math.min(i + 1, cards.length - 1));
  }
  function prev() {
    setShowBack(false);
    setIdx((i) => Math.max(i - 1, 0));
  }

  if (!current) return <div style={{ opacity: 0.8 }}>No cards in this filter.</div>;

  const face = showBack ? "Back" : "Front";
  const imgUrl = showBack ? current.back_image_url : current.front_image_url;
  const text = showBack ? current.back_text : current.front_text;

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Review</h3>
        <div>
          {idx + 1} / {cards.length}
        </div>
      </div>

      <div style={{ marginTop: 10, marginBottom: 10, opacity: 0.8 }}>{face}</div>

      <div
        onClick={() => setShowBack((v) => !v)}
        style={{
          cursor: "pointer",
          minHeight: 220,
          display: "grid",
          placeItems: "center",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 12,
          userSelect: "none",
        }}
        title="Click to flip"
      >
        {imgUrl ? (
          <img src={imgUrl} alt={face} style={{ maxWidth: "100%", maxHeight: 300 }} />
        ) : (
          <div style={{ fontSize: 18 }}>{text || "(no content)"}</div>
        )}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button onClick={prev} disabled={idx === 0}>
          Prev
        </button>
        <button onClick={() => setShowBack((v) => !v)}>
          Flip
        </button>
        <button onClick={next} disabled={idx === cards.length - 1}>
          Next
        </button>
      </div>
    </div>
  );
}

function CardList({ cards, onDelete }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Cards</h3>
      {cards.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No cards.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {cards.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 600 }}>Card #{c.id}</div>
                <div style={{ opacity: 0.8, fontSize: 14 }}>
                  {c.front_text || "(no front text)"} → {c.back_text || "(no back text)"}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  Tags: {c.tags?.map((t) => t.name).join(", ") || "(none)"}
                </div>
              </div>

              <button onClick={() => onDelete(c.id)} style={{ color: "crimson" }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tags, setTags] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [err, setErr] = useState("");

  async function deleteTag(tag) {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
  
    // If currently filtering by this tag, clear filter first
    if (String(selectedTagId) === String(tag.id)) {
      setSelectedTagId(null);
    }
  
    setErr("");
    try {
      await del(`/tags/${tag.id}/`);
      await refresh();
    } catch (e) {
      setErr(String(e));
    }
  }

  async function deleteCard(cardId) {
    if (!confirm(`Delete card #${cardId}?`)) return;
    setErr("");
    try {
      await del(`/cards/${cardId}/`);
      await refresh(); // reload tags + cards
    } catch (e) {
      setErr(String(e));
    }
  }


  async function refresh() {
    setErr("");
    try {
      const t = await fetchJSON("/tags/");
      setTags(t);

      const tagQuery = selectedTagId ? `?tag=${selectedTagId}` : "";
      const c = await fetchJSON(`/cards/${tagQuery}`);
      setCards(c);
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reload cards when filter changes
    (async () => {
      try {
        const tagQuery = selectedTagId ? `?tag=${selectedTagId}` : "";
        const c = await fetchJSON(`/cards/${tagQuery}`);
        setCards(c);
      } catch (e) {
        setErr(String(e));
      }
    })();
  }, [selectedTagId]);

  const selectedTag = useMemo(
    () => tags.find((t) => String(t.id) === String(selectedTagId)),
    [tags, selectedTagId]
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Flashcards App</h1>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>
        Backend must be running on <code>127.0.0.1:8000</code>. Create your superuser first.
      </div>

      {err && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <CreateTag onCreated={refresh} />
          <CreateCard tags={tags} onCreated={refresh} />
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div>Filter:</div>
            <TagPicker tags={tags} selectedTagId={selectedTagId} onChange={setSelectedTagId} />
            <div style={{ opacity: 0.7 }}>
              {selectedTag ? `(${selectedTag.name})` : ""}
            </div>
            <button onClick={refresh} style={{ marginLeft: "auto" }}>
              Refresh
            </button>
          </div>

          <Review cards={cards} />
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <TagList tags={tags} onDelete={deleteTag} />
          <CardList cards={cards} onDelete={deleteCard} />
        </div>
      </div>
    </div>
  );
}

