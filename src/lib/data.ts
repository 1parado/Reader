export interface Section {
  id: string;
  title?: string;
  content: string;
}

export const articleData: Section[] = [
  {
    id: "section_1",
    title: "Introduction to the Socratic Method",
    content: "The Socratic method is a form of cooperative argumentative dialogue between individuals, based on asking and answering questions to stimulate critical thinking and to draw out ideas and underlying presuppositions. It is named after the Classical Greek philosopher Socrates and is introduced by him in Plato's Theaetetus as midwifery (maieutics) because it is employed to bring out definitions implicit in the interlocutors' beliefs, or to help them further their understanding."
  },
  {
    id: "section_2",
    title: "Methodology",
    content: "The Socratic method is a method of hypothesis elimination, in that better hypotheses are found by steadily identifying and eliminating those that lead to contradictions. The Socratic method searches for general, commonly held truths that shape beliefs and scrutinizes them to determine their consistency with other beliefs. The basic form is a series of questions formulated as tests of logic and fact intended to help a person or group discover their beliefs about some topic, exploring definitions or logoi (singular logos) and seeking to characterize general characteristics shared by various particular instances."
  },
  {
    id: "section_3",
    title: "Application",
    content: "In the second half of the 5th century BC, sophists were teachers who specialized in using the tools of philosophy and rhetoric to entertain, impress, or persuade an audience to accept the speaker's point of view. Socrates promoted an alternative method of teaching, which came to be called the Socratic method. Socrates began to engage in such discussions with his fellow Athenians after his friend from youth, Chaerephon, visited the Oracle of Delphi, which asserted that no man in Greece was wiser than Socrates."
  },
  {
    id: "section_4",
    title: "Modern Use",
    content: "The Socratic method is widely used in contemporary legal education by many law schools in the United States. In a typical class setting, the professor asks a student a series of questions about a case to explore the legal principles and reasoning. This encourages students to think on their feet and articulate their thoughts clearly. It is also used in psychotherapy, particularly in Cognitive Behavioral Therapy (CBT), to help patients discover and challenge irrational thoughts."
  }
];
