import static com.hedera.services.utils.forensics.RecordParsers.parseV6RecordStreamEntriesIn;
public class Parser {
    public static void main(String[] args) {
        try {
            final var entries = parseV6RecordStreamEntriesIn("temp");
            entries.stream().forEach(System.out::println);
        }
        catch(Exception e) {
            System.out.println(e.toString());
        }
    }
}