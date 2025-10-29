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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (filteredPlaybooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="h-20 w-20 text-muted-foreground/30 mb-6" />
        <h3 className="text-2xl font-semibold mb-3">No playbooks found</h3>
        <p className="text-muted-foreground max-w-md text-base">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
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
