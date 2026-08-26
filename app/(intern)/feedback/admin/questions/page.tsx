import {
  getAnswerCountsByQuestion,
  getQuestionSets,
  getQuestionSetUsageCounts,
} from "@/lib/feedback";
import { EmptyState, NoteBox, PageShell } from "@/app/(intern)/_components/ui/surfaces";
import NewQuestionSetPanel from "../_components/NewQuestionSetPanel";
import QuestionSetEditor, { type SetBlock } from "../_components/QuestionSetEditor";

export const dynamic = "force-dynamic";

export default async function QuestionsAdminPage() {
  const [sets, usage, answerCounts] = await Promise.all([
    getQuestionSets(),
    getQuestionSetUsageCounts(),
    getAnswerCountsByQuestion(),
  ]);

  const bloecke: SetBlock[] = sets.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    produkte: usage[s.id] ?? 0,
    fragen: s.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      label_left: q.label_left,
      label_right: q.label_right,
      scale_max: q.scale_max,
      antworten: answerCounts[q.id] ?? 0,
    })),
  }));

  const verwaist = bloecke.filter((b) => b.produkte === 0).length;

  return (
    <PageShell
      breit
      eyebrow="Register 02"
      title="Fragensets"
      lead="Wiederverwendbare Bausteine, die sich beliebigen Produkten zuordnen lassen. Die hedonische Skala und die Preisfragen sind fest und laufen immer mit."
    >
      <NewQuestionSetPanel offenBeimStart={bloecke.length === 0} />

      {verwaist > 0 && bloecke.length > 0 && (
        <div className="mb-5">
          <NoteBox tone="info">
            {verwaist} von {bloecke.length} Sets sind keinem Produkt zugeordnet und werden im Store
            damit nicht gefragt. Zuordnen geht auf der Produktkarte unter „Bearbeiten“.
          </NoteBox>
        </div>
      )}

      {bloecke.length === 0 ? (
        <EmptyState
          titel="Noch kein Fragenset angelegt."
          text="Ein Set ist ein Bündel von Fragen — z.B. „Verpackung“ mit drei Gegensatzpaaren. Dasselbe Set kann an mehreren Produkten hängen."
        />
      ) : (
        <div className="space-y-4">
          {bloecke.map((set) => (
            <QuestionSetEditor key={set.id} set={set} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
