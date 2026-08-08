import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createQuestion,
  createQuestionSet,
  deleteQuestion,
  getQuestionSets,
  type QuestionType,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";

async function createSetAction(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await createQuestionSet(name, (formData.get("description") as string)?.trim() || null);
  redirect("/feedback/admin/questions");
}

async function addQuestionAction(formData: FormData) {
  "use server";
  const questionSetId = formData.get("question_set_id") as string;
  const type = formData.get("type") as QuestionType;
  if (!questionSetId || !type) return;

  await createQuestion({
    questionSetId,
    type,
    position: Number(formData.get("position") ?? 0),
    prompt: (formData.get("prompt") as string)?.trim() || null,
    labelLeft: (formData.get("label_left") as string)?.trim() || null,
    labelRight: (formData.get("label_right") as string)?.trim() || null,
    scaleMax: formData.get("scale_max") ? Number(formData.get("scale_max")) : null,
  });

  redirect("/feedback/admin/questions");
}

async function deleteQuestionAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (id) await deleteQuestion(id);
  redirect("/feedback/admin/questions");
}

const TYPE_LABELS: Record<QuestionType, string> = {
  semantic_diff: "Semantisches Differential (links ↔ rechts)",
  likert: "Likert-Zustimmung (Statement, 1–N)",
  text: "Freitext (optional)",
};

export default async function QuestionsAdminPage() {
  const sets = await getQuestionSets();

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/feedback/admin" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
          ← Produkte
        </Link>
        <h1
          className="text-cream text-4xl tracking-widest mt-3 mb-2"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Fragensets
        </h1>
        <p className="text-stone text-sm mb-8">
          Wiederverwendbare Fragen-Bausteine (z.B. &quot;Basis&quot;, &quot;Verpackung&quot;), die sich beliebigen
          Produkten zuordnen lassen. Hedonic-Skala und Preisfragen sind separat und immer fest.
        </p>

        <div className="bg-green-mid border border-stone-dark p-6 mb-6">
          <h2 className="text-cream text-sm font-mono uppercase tracking-widest mb-4">
            Neues Set anlegen
          </h2>
          <form action={createSetAction} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Name *
              </label>
              <input
                name="name"
                required
                placeholder="z.B. Verpackung"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Beschreibung
              </label>
              <input
                name="description"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
              >
                Set anlegen →
              </button>
            </div>
          </form>
        </div>

        <div className="bg-green-mid border border-stone-dark p-6 mb-10">
          <h2 className="text-cream text-sm font-mono uppercase tracking-widest mb-4">
            Frage zu Set hinzufügen
          </h2>
          <form action={addQuestionAction} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Set *
              </label>
              <select
                name="question_set_id"
                required
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Typ *
              </label>
              <select
                name="type"
                required
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Statement / Frage — nur für Likert und Freitext
              </label>
              <input
                name="prompt"
                placeholder='z.B. "Die Verpackung wirkt nachhaltig/umweltfreundlich."'
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Skalen-Label links — semant. Diff. + Likert
              </label>
              <input
                name="label_left"
                placeholder="z.B. unauffällig / stimme gar nicht zu"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Skalen-Label rechts — semant. Diff. + Likert
              </label>
              <input
                name="label_right"
                placeholder="z.B. auffällig / stimme voll zu"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Skalen-Maximum
              </label>
              <input
                type="number"
                name="scale_max"
                min={2}
                max={10}
                placeholder="7 (semant. Diff.) / 5 (Likert)"
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div>
              <label className="block text-stone text-xs font-mono uppercase tracking-widest mb-1">
                Position (Reihenfolge)
              </label>
              <input
                type="number"
                name="position"
                min={0}
                defaultValue={0}
                className="w-full bg-green-dark border border-stone-dark text-cream px-3 py-2 text-sm focus:outline-none focus:border-bronze"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-bronze text-green-dark font-semibold px-6 py-3 text-sm hover:bg-bronze-light transition-colors"
              >
                Frage hinzufügen →
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {sets.map((set) => (
            <div key={set.id} className="bg-sage-warm p-5">
              <h3 className="text-green-dark text-lg font-semibold">{set.name}</h3>
              {set.description && <p className="text-stone-dark text-sm mb-3">{set.description}</p>}
              {set.questions.length === 0 ? (
                <p className="text-stone-dark text-sm">Noch keine Fragen in diesem Set.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {set.questions
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((q) => (
                      <div key={q.id} className="flex items-center justify-between bg-sage px-3 py-2 text-sm">
                        <span className="text-green-dark">
                          <span className="text-stone-dark text-xs font-mono uppercase mr-2">
                            {q.type}
                          </span>
                          {q.type === "semantic_diff" && `${q.label_left} ↔ ${q.label_right}`}
                          {q.type === "likert" && q.prompt}
                          {q.type === "text" && q.prompt}
                        </span>
                        <form action={deleteQuestionAction}>
                          <input type="hidden" name="id" value={q.id} />
                          <button
                            type="submit"
                            className="text-stone-dark text-xs hover:text-red-600 transition-colors"
                          >
                            entfernen
                          </button>
                        </form>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
          {sets.length === 0 && <p className="text-stone text-sm">Noch keine Fragensets angelegt.</p>}
        </div>
      </div>
    </div>
  );
}
