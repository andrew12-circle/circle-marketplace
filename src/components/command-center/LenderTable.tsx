import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Lender {
  name: string;
  count: number;
  percentage: number;
}

interface LenderTableProps {
  lenders: Lender[];
}

export const LenderTable = ({ lenders }: LenderTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lenders Used</CardTitle>
      </CardHeader>
      <CardContent>
        {lenders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No lender data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lender Name</TableHead>
                <TableHead className="text-center">Count</TableHead>
                <TableHead className="text-center">% Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lenders.slice(0, 10).map((lender, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{lender.name}</TableCell>
                  <TableCell className="text-center">{lender.count}</TableCell>
                  <TableCell className="text-center">{lender.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};