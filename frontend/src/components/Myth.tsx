import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type MythType = {
  text: string;
  link: string;
};

const Myth = () => {
  const [myths, setMyths] = useState<MythType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/scrape")
      .then((response) => response.json())
      .then((data) => {
        setMyths(data.myths);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching myths:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col items-center p-8">
      <h1 className="text-4xl font-semibold text-gray-900 mb-8">Health Myths & Facts</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
        {loading
          ? [...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))
          : myths.map((myth, index) => (
              <Card key={index} className="shadow-lg rounded-lg bg-white transition-transform transform hover:scale-105">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {myth.text}
                  </h2>
                  <a href={myth.link} target="_blank" rel="noopener noreferrer">
                    <Button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white">Read More</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default Myth;
