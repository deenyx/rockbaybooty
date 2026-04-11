import { useState } from "react";
import fs from "fs";
import path from "path";

const questions = [
  { label: "What is your display name?", key: "displayName", type: "text" },
  { label: "What are you looking for? (e.g., friends, dating, chat)", key: "lookingFor", type: "text" },
  { label: "Tell us a bit about yourself", key: "about", type: "textarea" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState("");
  const [userPass, setUserPass] = useState("");

  const handleChange = (e) => {
    setAnswers({ ...answers, [questions[step].key]: e.target.value });
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Generate user ID and passcode
      const newUserId = Math.random().toString(36).substring(2, 10);
      const newUserPass = Math.random().toString(36).substring(2, 10);
      setUserId(newUserId);
      setUserPass(newUserPass);

      // Save profile to profiles.json (basic file write, works only in Node/server)
      try {
        const filePath = path.join(process.cwd(), "src", "profiles.json");
        let profiles = [];
        if (fs.existsSync(filePath)) {
          profiles = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }
        profiles.push({ ...answers, userId: newUserId, passcode: newUserPass });
        fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2));
      } catch (err) {
        // Ignore file write errors in browser
      }
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Welcome aboard!</h2>
        <p>Your profile has been created. You can now access all features.</p>
        <div className="mt-4 p-4 bg-white/10 rounded-lg text-white/80">
          <div><b>Your User ID:</b> {userId}</div>
          <div><b>Your Passcode:</b> {userPass}</div>
          <div className="text-xs mt-2">Save these! You'll need them to sign in.</div>
        </div>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleNext} className="bg-white/10 p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full max-w-md">
        <label className="text-lg font-medium text-white/80 mb-2">{q.label}</label>
        {q.type === "textarea" ? (
          <textarea
            className="rounded-lg p-3 bg-white/20 text-white min-h-[80px]"
            value={answers[q.key] || ""}
            onChange={handleChange}
            required
          />
        ) : (
          <input
            className="rounded-lg p-3 bg-white/20 text-white"
            type={q.type}
            value={answers[q.key] || ""}
            onChange={handleChange}
            required
          />
        )}
        <button
          type="submit"
          className="rounded-full bg-purple-700/80 px-8 py-3 text-xl text-white font-medium hover:bg-purple-600/90 transition mt-4"
        >
          {step < questions.length - 1 ? "Next" : "Finish"}
        </button>
      </form>
    </div>
  );
}
