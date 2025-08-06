import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TitleCompany {
  name: string;
  count: number;
  percentage: number;
}

interface TitleCompanyTableProps {
  titleCompanies: TitleCompany[];
}

export const TitleCompanyTable = ({ titleCompanies }: TitleCompanyTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title Companies Used</CardTitle>
      </CardHeader>
      <CardContent>
        {titleCompanies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No title company data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title Company Name</TableHead>
                <TableHead className="text-center">Count</TableHead>
                <TableHead className="text-center">% Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {titleCompanies.slice(0, 10).map((company, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-center">{company.count}</TableCell>
                  <TableCell className="text-center">{company.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};