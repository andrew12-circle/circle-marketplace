import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlaybookCard } from "./PlaybookCard";
import { PlaybookProductSheet } from "./PlaybookProductSheet";
import { type FilterState } from "./PlaybooksFilters";
import { usePlaybooksFilters } from "@/hooks/usePlaybooksFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

interface PlaybooksGridProps {
  searchQuery: string;
  filters: FilterState;
}

export const PlaybooksGrid = ({ searchQuery, filters }: PlaybooksGridProps) => {
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);

  const { data: playbooks, isLoading } = useQuery({
    queryKey: ["playbooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbooks")
        .select("*")
        .eq("status", "live")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredPlaybooks = usePlaybooksFilters(playbooks || [], searchQuery, filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (filteredPlaybooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Playbooks Found</h3>
        <p className="text-muted-foreground max-w-md">
          Nothing matches that title or location. Try a nearby market or clear filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlaybooks.map((playbook) => (
          <PlaybookCard
            key={playbook.id}
            playbook={playbook}
            onClick={() => setSelectedPlaybookId(playbook.id)}
          />
        ))}
      </div>

      {selectedPlaybookId && (
        <PlaybookProductSheet
          playbookId={selectedPlaybookId}
          open={!!selectedPlaybookId}
          onOpenChange={(open) => !open && setSelectedPlaybookId(null)}
        />
      )}
    </>
  );
};
