import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <h1 className="text-3xl bg-amber-600">Hello World</h1>
    </div>
  );
}
